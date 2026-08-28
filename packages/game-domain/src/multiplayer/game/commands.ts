import type { CommandError } from '../errors'
import { err, ok, type Result } from '../../shared/result'
import type { CountryId } from '../../shared/types'
import type { MemberId } from '../room/types'
import type {
	CompletedRoundState,
	EvaluatedSubmission,
	GameConfig,
	GameLeaderboardState,
	GameOpenState,
	GameParticipantState,
	GameRevealedState,
	GameState,
	LeaderboardRoundState,
	LockedSubmission,
	OpenRoundState,
	RevealedRoundState,
} from './types'
import { calculateAnswerScore } from './scoring'
import { createLeaderboard } from './leaderboard'

export type GameCommand =
	| {
			type: 'SUBMIT_ANSWER'
			participantId: MemberId
			countryId: CountryId
			now: number
	  }
	| {
			type: 'REVEAL_ROUND'
			now: number
	  }
	| {
			type: 'SHOW_LEADERBOARD'
			now: number
	  }
	| {
			type: 'ADVANCE_ROUND'
			now: number
	  }
	| {
			type: 'COMPLETE_GAME'
			now: number
	  }

function evaluateSubmissions(
	participantsById: Record<MemberId, GameParticipantState>,
	round: OpenRoundState,
): {
	participantsById: Record<MemberId, GameParticipantState>
	submissions: Record<string, EvaluatedSubmission>
} {
	const nextParticipantsById = { ...participantsById }
	const submissions: Record<string, EvaluatedSubmission> = {}

	for (const participant of Object.values(nextParticipantsById)) {
		const submission = round.submissions[participant.id]
		if (!submission) {
			const noAnswerSubmission: EvaluatedSubmission = {
				participantId: participant.id,
				countryId: null,
				submittedAt: null,
				isCorrect: false,
				score: 0,
			}

			submissions[participant.id] = noAnswerSubmission
			continue
		}

		const isCorrect = submission.countryId === round.questionId
		const score = calculateAnswerScore(
			round.startedAt,
			submission.submittedAt,
			isCorrect,
		)
		const answeredSubmission: EvaluatedSubmission = {
			participantId: submission.participantId,
			countryId: submission.countryId,
			submittedAt: submission.submittedAt,
			isCorrect,
			score,
		}

		submissions[participant.id] = answeredSubmission
		nextParticipantsById[participant.id] = {
			...participant,
			score: participant.score + score,
			correctCount: participant.correctCount + (isCorrect ? 1 : 0),
		}
	}

	return {
		participantsById: nextParticipantsById,
		submissions,
	}
}

function isLeaderboardRoundState(
	round: RevealedRoundState | LeaderboardRoundState,
): round is LeaderboardRoundState {
	return Object.hasOwn(round, 'leaderboardShownAt')
}

export function createRound(
	questionIds: readonly CountryId[],
	config: Readonly<GameConfig>,
	questionIndex: number,
	now: number,
): OpenRoundState {
	const questionId = questionIds[questionIndex]
	if (!questionId) {
		throw new Error(
			`Question index ${questionIndex} is out of range for this room.`,
		)
	}

	return {
		questionIndex,
		questionId,
		startedAt: now,
		deadlineAt: config.questionDurationMs
			? now + config.questionDurationMs
			: null,
		submissions: {},
	}
}

export function archiveRound(
	round: RevealedRoundState | LeaderboardRoundState,
): CompletedRoundState {
	return {
		questionIndex: round.questionIndex,
		questionId: round.questionId,
		startedAt: round.startedAt,
		deadlineAt: round.deadlineAt,
		revealedAt: round.revealedAt,
		leaderboardShownAt: isLeaderboardRoundState(round)
			? round.leaderboardShownAt
			: null,
		submissions: round.submissions,
	}
}

function requireParticipant(
	state: GameState,
	participantId: MemberId,
): Result<GameParticipantState, CommandError> {
	const participant = state.participantsById[participantId]

	return participant
		? ok(participant)
		: err({ code: 'game_participant_not_found' })
}

export function applyGameCommand(
	state: GameState,
	command: GameCommand,
): Result<GameState, CommandError> {
	switch (command.type) {
		case 'REVEAL_ROUND': {
			if (state.phase !== 'open') {
				return err({
					code: 'game_not_open',
				})
			}

			const evaluation = evaluateSubmissions(
				state.participantsById,
				state.currentRound,
			)

			const nextState: GameRevealedState = {
				...state,
				phase: 'revealed',
				participantsById: evaluation.participantsById,
				currentRound: {
					questionIndex: state.currentRound.questionIndex,
					questionId: state.currentRound.questionId,
					startedAt: state.currentRound.startedAt,
					deadlineAt: state.currentRound.deadlineAt,
					revealedAt: command.now,
					submissions: evaluation.submissions,
				},
			}

			return ok(nextState)
		}

		case 'SHOW_LEADERBOARD': {
			if (state.phase !== 'revealed') {
				return err({
					code: 'game_not_revealed',
				})
			}

			const nextState: GameLeaderboardState = {
				...state,
				phase: 'leaderboard',
				currentRound: {
					questionIndex: state.currentRound.questionIndex,
					questionId: state.currentRound.questionId,
					startedAt: state.currentRound.startedAt,
					deadlineAt: state.currentRound.deadlineAt,
					revealedAt: state.currentRound.revealedAt,
					leaderboardShownAt: command.now,
					submissions: state.currentRound.submissions,
				},
			}

			return ok(nextState)
		}

		case 'ADVANCE_ROUND': {
			if (state.phase !== 'revealed' && state.phase !== 'leaderboard') {
				return err({
					code: 'game_not_advanceable',
				})
			}

			const archivedRound = archiveRound(state.currentRound)
			const completedRounds = [...state.completedRounds, archivedRound]
			const nextQuestionIndex = state.currentRound.questionIndex + 1

			const nextState: GameOpenState = {
				phase: 'open',
				gameId: state.gameId,
				session: state.session,
				participantsById: state.participantsById,
				startedAt: state.startedAt,
				completedRounds,
				currentRound: createRound(
					state.session.questionIds,
					state.session.config,
					nextQuestionIndex,
					command.now,
				),
			}

			return ok(nextState)
		}

		case 'SUBMIT_ANSWER': {
			if (state.phase !== 'open') {
				return err({
					code: 'game_not_open',
				})
			}

			const participantResult = requireParticipant(
				state,
				command.participantId,
			)
			if (!participantResult.ok) {
				return participantResult
			}

			if (state.currentRound.submissions[command.participantId]) {
				return err({
					code: 'participant_already_submitted',
				})
			}

			if (!state.session.eligibleIds.includes(command.countryId)) {
				return err({
					code: 'country_not_eligible',
				})
			}

			const submission: LockedSubmission = {
				participantId: command.participantId,
				countryId: command.countryId,
				submittedAt: command.now,
			}

			return ok({
				...state,
				currentRound: {
					...state.currentRound,
					submissions: {
						...state.currentRound.submissions,
						[command.participantId]: submission,
					},
				},
			})
		}

		case 'COMPLETE_GAME': {
			if (state.phase === 'completed') {
				return err({
					code: 'game_already_completed',
				})
			}
			if (state.phase !== 'revealed' && state.phase !== 'leaderboard') {
				return err({
					code: 'game_not_ready_to_complete',
				})
			}

			const archivedRound = archiveRound(state.currentRound)
			const completedRounds = [...state.completedRounds, archivedRound]

			return ok({
				phase: 'completed',
				gameId: state.gameId,
				session: state.session,
				participantsById: state.participantsById,
				completedAt: command.now,
				result: {
					gameId: state.gameId,
					leaderboard: createLeaderboard(state.participantsById),
					rounds: completedRounds,
					finishedAt: command.now,
				},
			})
		}
	}
}
