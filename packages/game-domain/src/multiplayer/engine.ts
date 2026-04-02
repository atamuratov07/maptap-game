import { assertNever, type CommandError } from '../shared/errors'
import { err, ok, type Result } from '../shared/result'
import type { GameCommand } from './commands'
import { normalizePlayerName } from './factory'
import { calculateAnswerScore } from './score'
import type {
	ArchivedGameRoundState,
	EvaluatedGameSubmission,
	GameConfig,
	GamePlayerState,
	GameRoomState,
	LeaderboardGameRoundState,
	LeaderboardGameState,
	LockedGameSubmission,
	OpenGameRoundState,
	PlayerId,
	QuestionOpenGameState,
	QuestionRevealedGameState,
	RevealedGameRoundState,
} from './types'

function createRound(
	questionIds: string[],
	config: GameConfig,
	questionIndex: number,
	now: number,
): OpenGameRoundState {
	const questionId = questionIds[questionIndex]
	if (!questionId) {
		throw new Error(
			`Question index ${questionIndex} is out of range for this room.`,
		)
	}

	return {
		phase: 'open',
		questionIndex,
		questionId,
		startedAt: now,
		deadlineAt: now + config.questionDurationMs,
		submissions: {},
	}
}

function archiveRound(
	round: RevealedGameRoundState | LeaderboardGameRoundState,
): ArchivedGameRoundState {
	return {
		questionIndex: round.questionIndex,
		questionId: round.questionId,
		startedAt: round.startedAt,
		deadlineAt: round.deadlineAt,
		revealedAt: round.revealedAt,
		leaderboardShownAt:
			round.phase === 'leaderboard' ? round.leaderboardShownAt : null,
		submissions: round.submissions,
	}
}

function canUsePlayerName(
	state: GameRoomState,
	playerName: string,
): boolean {
	const normalizedPlayerName = playerName.toLocaleLowerCase()

	return !Object.values(state.playersById).some(player => {
		return player.name.toLocaleLowerCase() === normalizedPlayerName
	})
}

function requirePlayer(
	state: GameRoomState,
	playerId: PlayerId,
): Result<GamePlayerState, CommandError> {
	const player = state.playersById[playerId]

	return player ? ok(player) : err({ code: 'player_not_found' })
}

function requireHost(
	state: GameRoomState,
	actorPlayerId: PlayerId,
): Result<GamePlayerState, CommandError> {
	const actorResult = requirePlayer(state, actorPlayerId)
	if (!actorResult.ok) {
		return actorResult
	}

	const actor = actorResult.value

	if (actor.id !== state.hostPlayerId) {
		return err({
			code: 'only_host_can_start',
		})
	}

	return ok(actor)
}

function evaluateSubmissions(
	playersById: Record<string, GamePlayerState>,
	round: OpenGameRoundState,
): {
	playersById: Record<string, GamePlayerState>
	submissions: Record<string, EvaluatedGameSubmission>
} {
	const nextPlayersById = { ...playersById }
	const submissions: Record<string, EvaluatedGameSubmission> = {}

	for (const player of Object.values(nextPlayersById)) {
		const submission = round.submissions[player.id]
		if (!submission) {
			const noAnswerSubmission: EvaluatedGameSubmission = {
				playerId: player.id,
				countryId: null,
				submittedAt: round.deadlineAt,
				isCorrect: false,
				score: 0,
			}

			submissions[player.id] = noAnswerSubmission
			continue
		}

		const isCorrect = submission.countryId === round.questionId
		const score = calculateAnswerScore(
			round.startedAt,
			submission.submittedAt,
			isCorrect,
		)
		const answeredSubmission: EvaluatedGameSubmission = {
			playerId: submission.playerId,
			countryId: submission.countryId,
			submittedAt: submission.submittedAt,
			isCorrect,
			score,
		}

		submissions[player.id] = answeredSubmission
		nextPlayersById[player.id] = {
			...player,
			score: player.score + score,
			correctCount: player.correctCount + (isCorrect ? 1 : 0),
		}
	}

	return {
		playersById: nextPlayersById,
		submissions,
	}
}

export function applyGameCommand(
	state: GameRoomState,
	command: GameCommand,
): Result<GameRoomState, CommandError> {
	switch (command.type) {
		case 'JOIN_PLAYER': {
			if (state.phase !== 'lobby') {
				return err({
					code: 'room_not_joinable',
				})
			}

			const name = normalizePlayerName(command.name)
			if (name.length === 0) {
				return err({
					code: 'player_name_required',
				})
			}

			const existingPlayerResult = requirePlayer(state, command.playerId)
			if (existingPlayerResult.ok) {
				return err({
					code: 'player_already_joined',
				})
			}

			if (!canUsePlayerName(state, name)) {
				return err({
					code: 'player_name_taken',
				})
			}

			return ok({
				...state,
				playersById: {
					...state.playersById,
					[command.playerId]: {
						id: command.playerId,
						name,
						role: 'player',
						connected: true,
						joinedAt: command.now,
						lastConnectedAt: command.now,
						lastDisconnectedAt: null,
						score: 0,
						correctCount: 0,
					},
				},
				playerOrder: [...state.playerOrder, command.playerId],
			})
		}

		case 'RECONNECT_PLAYER': {
			const playerResult = requirePlayer(state, command.playerId)
			if (!playerResult.ok) {
				return playerResult
			}

			const player = playerResult.value

			if (player.connected) {
				return err({
					code: 'player_already_connected',
				})
			}

			return ok({
				...state,
				playersById: {
					...state.playersById,
					[command.playerId]: {
						...player,
						connected: true,
						lastConnectedAt: command.now,
					},
				},
			})
		}

		case 'DISCONNECT_PLAYER': {
			const playerResult = requirePlayer(state, command.playerId)
			if (!playerResult.ok) {
				return playerResult
			}

			const player = playerResult.value

			if (!player.connected) {
				return ok(state)
			}

			return ok({
				...state,
				playersById: {
					...state.playersById,
					[command.playerId]: {
						...player,
						connected: false,
						lastDisconnectedAt: command.now,
					},
				},
			})
		}

		case 'START_GAME': {
			if (state.phase !== 'lobby') {
				return err({
					code: 'room_not_in_lobby',
				})
			}

			const hostResult = requireHost(state, command.actorPlayerId)
			if (!hostResult.ok) {
				return hostResult
			}

			const nextState: QuestionOpenGameState = {
				...state,
				phase: 'question_open',
				activeRound: createRound(
					state.questionIds,
					state.config,
					0,
					command.now,
				),
			}

			return ok(nextState)
		}

		case 'SUBMIT_ANSWER': {
			if (state.phase !== 'question_open') {
				return err({
					code: 'room_not_in_question_open',
				})
			}

			const playerResult = requirePlayer(state, command.playerId)
			if (!playerResult.ok) {
				return playerResult
			}

			const player = playerResult.value

			if (!player.connected) {
				return err({
					code: 'player_not_connected',
				})
			}

			if (state.activeRound.submissions[command.playerId]) {
				return err({
					code: 'player_already_submitted',
				})
			}

			const submission: LockedGameSubmission = {
				playerId: command.playerId,
				countryId: command.countryId,
				submittedAt: command.now,
			}

			return ok({
				...state,
				activeRound: {
					...state.activeRound,
					submissions: {
						...state.activeRound.submissions,
						[command.playerId]: submission,
					},
				},
			})
		}

		case 'REVEAL_QUESTION': {
			if (state.phase !== 'question_open') {
				return err({
					code: 'room_not_in_question_open',
				})
			}

			const evaluation = evaluateSubmissions(
				state.playersById,
				state.activeRound,
			)

			const nextState: QuestionRevealedGameState = {
				...state,
				phase: 'question_revealed',
				playersById: evaluation.playersById,
				activeRound: {
					phase: 'revealed',
					questionIndex: state.activeRound.questionIndex,
					questionId: state.activeRound.questionId,
					startedAt: state.activeRound.startedAt,
					deadlineAt: state.activeRound.deadlineAt,
					revealedAt: command.now,
					submissions: evaluation.submissions,
				},
			}

			return ok(nextState)
		}

		case 'SHOW_LEADERBOARD': {
			if (state.phase !== 'question_revealed') {
				return err({
					code: 'room_not_in_question_revealed',
				})
			}

			const nextState: LeaderboardGameState = {
				...state,
				phase: 'leaderboard',
				activeRound: {
					phase: 'leaderboard',
					questionIndex: state.activeRound.questionIndex,
					questionId: state.activeRound.questionId,
					startedAt: state.activeRound.startedAt,
					deadlineAt: state.activeRound.deadlineAt,
					revealedAt: state.activeRound.revealedAt,
					leaderboardShownAt: command.now,
					submissions: state.activeRound.submissions,
				},
			}

			return ok(nextState)
		}

		case 'ADVANCE_TO_NEXT_QUESTION': {
			if (state.phase === 'finished') {
				return err({
					code: 'room_already_finished',
				})
			}

			if (
				state.phase !== 'question_revealed' &&
				state.phase !== 'leaderboard'
			) {
				return err({
					code:
						state.phase === 'lobby'
							? 'room_not_in_question_revealed'
							: 'room_not_on_leaderboard',
				})
			}

			const archivedRound = archiveRound(state.activeRound)
			const completedRounds = [...state.completedRounds, archivedRound]
			const nextQuestionIndex = archivedRound.questionIndex + 1

			if (nextQuestionIndex >= state.questionIds.length) {
				return ok({
					roomId: state.roomId,
					roomCode: state.roomCode,
					hostPlayerId: state.hostPlayerId,
					config: state.config,
					questionIds: state.questionIds,
					playersById: state.playersById,
					playerOrder: state.playerOrder,
					createdAt: state.createdAt,
					completedRounds,
					phase: 'finished',
					finishedAt: command.now,
				})
			}

			const nextState: QuestionOpenGameState = {
				roomId: state.roomId,
				roomCode: state.roomCode,
				hostPlayerId: state.hostPlayerId,
				config: state.config,
				questionIds: state.questionIds,
				playersById: state.playersById,
				playerOrder: state.playerOrder,
				createdAt: state.createdAt,
				completedRounds,
				phase: 'question_open',
				activeRound: createRound(
					state.questionIds,
					state.config,
					nextQuestionIndex,
					command.now,
				),
			}

			return ok(nextState)
		}

		case 'TERMINATE_GAME': {
			if (state.phase === 'finished') {
				return err({
					code: 'room_already_finished',
				})
			}

			if (state.phase === 'lobby' || state.phase === 'question_open') {
				return ok({
					roomId: state.roomId,
					roomCode: state.roomCode,
					hostPlayerId: state.hostPlayerId,
					config: state.config,
					questionIds: state.questionIds,
					playersById: state.playersById,
					playerOrder: state.playerOrder,
					createdAt: state.createdAt,
					completedRounds: state.completedRounds,
					phase: 'finished',
					finishedAt: command.now,
				})
			}

			const archivedRound = archiveRound(state.activeRound)

			return ok({
				roomId: state.roomId,
				roomCode: state.roomCode,
				hostPlayerId: state.hostPlayerId,
				config: state.config,
				questionIds: state.questionIds,
				playersById: state.playersById,
				playerOrder: state.playerOrder,
				createdAt: state.createdAt,
				completedRounds: [...state.completedRounds, archivedRound],
				phase: 'finished',
				finishedAt: command.now,
			})
		}

		default:
			return assertNever(command)
	}
}
