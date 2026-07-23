import { err, ok, type Result } from '../../shared/result'
import type { CountryId } from '../../shared/types'
import type { CommandError } from '../errors'
import type { MemberId } from '../room/types'
import { createLeaderboard } from './leaderboard'
import { calculateAnswerScore } from './scoring'
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
	OpenRoundState,
	RevealedRoundState,
} from './types'

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
		deadlineAt: now + config.questionDurationMs,
		submissions: {},
	}
}

function isLeaderboardRoundState(
	round: RevealedRoundState | LeaderboardRoundState,
): round is LeaderboardRoundState {
	return Object.hasOwn(round, 'leaderboardShownAt')
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
				submittedAt: round.deadlineAt,
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

export interface GameTransitionContext {
	now: number
}

export type GameTransition =
	| { type: 'REVEAL_ROUND'; now: number }
	| { type: 'SHOW_LEADERBOARD'; now: number }
	| { type: 'ADVANCE_ROUND'; now: number }
	| { type: 'COMPLETE_GAME'; now: number }

export function applyGameTransition(
	state: GameState,
	transition: GameTransition,
): Result<GameState, CommandError> {
	switch (transition.type) {
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
					revealedAt: transition.now,
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
					leaderboardShownAt: transition.now,
					submissions: state.currentRound.submissions,
				},
			}

			return ok(nextState)
		}

		case 'ADVANCE_ROUND': {
			if (state.phase !== 'leaderboard') {
				return err({
					code: 'game_not_on_leaderboard',
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
					transition.now,
				),
			}

			return ok(nextState)
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
				completedAt: transition.now,
				result: {
					gameId: state.gameId,
					leaderboard: createLeaderboard(state.participantsById),
					rounds: completedRounds,
					finishedAt: transition.now,
				},
			})
		}
	}
}

export function advanceGame(
	state: GameState,
	context: GameTransitionContext,
): Result<GameState, CommandError> {
	switch (state.phase) {
		case 'open': {
			const transitionResult = applyGameTransition(state, {
				type: 'REVEAL_ROUND',
				now: context.now,
			})

			if (!transitionResult.ok) {
				return err(transitionResult.error)
			}

			return ok(transitionResult.value)
		}

		case 'revealed': {
			const nextQuestionIndex = state.currentRound.questionIndex + 1

			let transition: GameTransition

			if (nextQuestionIndex < state.session.questionIds.length) {
				transition = {
					type: 'SHOW_LEADERBOARD',
					now: context.now,
				}
			} else {
				transition = {
					type: 'COMPLETE_GAME',
					now: context.now,
				}
			}

			const transitionResult = applyGameTransition(state, transition)

			if (!transitionResult.ok) {
				return err(transitionResult.error)
			}

			return ok(transitionResult.value)
		}
		case 'leaderboard': {
			const nextQuestionIndex = state.currentRound.questionIndex + 1

			let transition: GameTransition
			if (nextQuestionIndex < state.session.questionIds.length) {
				transition = {
					type: 'ADVANCE_ROUND',
					now: context.now,
				}
			} else {
				transition = {
					type: 'COMPLETE_GAME',
					now: context.now,
				}
			}

			const transitionResult = applyGameTransition(state, transition)

			if (!transitionResult.ok) {
				return err(transitionResult.error)
			}

			return ok(transitionResult.value)
		}
		case 'completed': {
			return ok(state)
		}
	}
}
