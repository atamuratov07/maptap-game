import { assertNever, type CommandError } from '../shared/errors'
import { err, ok, type Result } from '../shared/result'
import { archiveRound, createRound } from './round'
import { calculateAnswerScore } from './score'
import type {
	EvaluatedGameSubmission,
	GamePlayerState,
	OpenRoundGameState,
	RoomLeaderboardState,
	RoomQuestionOpenState,
	RoomQuestionRevealedState,
	RoomState,
} from './types'

export type RoomTransition =
	| {
			type: 'REVEAL_QUESTION'
			now: number
	  }
	| {
			type: 'SHOW_LEADERBOARD'
			now: number
	  }
	| {
			type: 'ADVANCE_TO_NEXT_QUESTION'
			now: number
	  }

function evaluateSubmissions(
	playersById: Record<string, GamePlayerState>,
	round: OpenRoundGameState,
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

export function applyRoomTransition(
	state: RoomState,
	command: RoomTransition,
): Result<RoomState, CommandError> {
	switch (command.type) {
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

			const nextState: RoomQuestionRevealedState = {
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

			const nextState: RoomLeaderboardState = {
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

			const nextState: RoomQuestionOpenState = {
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

		default:
			return assertNever(command)
	}
}
