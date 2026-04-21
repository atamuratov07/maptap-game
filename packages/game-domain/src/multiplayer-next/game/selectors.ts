import type { CountryId } from '../../shared/types'
import type { MemberId } from '../room/types'
import { createLeaderboard } from './leaderboard'
import type {
	EvaluatedSubmission,
	GameLeaderboardEntry,
	GameParticipantState,
	GameState,
	LockedSubmission,
} from './types'

export type ActiveGameState = Exclude<GameState, { phase: 'completed' }>

export function isActiveGameState(state: GameState): state is ActiveGameState {
	return state.phase !== 'completed'
}

export function getGameParticipant(
	state: GameState,
	participantId: MemberId,
): GameParticipantState | undefined {
	return state.participantsById[participantId]
}

export function getGameParticipants(state: GameState): GameParticipantState[] {
	return Object.values(state.participantsById)
}

export function getGameParticipantCount(state: GameState): number {
	return Object.keys(state.participantsById).length
}

export function getGameQuestionCount(state: GameState): number {
	return state.session.questionIds.length
}

export function getCurrentGameRound(state: GameState) {
	return isActiveGameState(state) ? state.currentRound : null
}

export function getGameCurrentQuestionId(state: GameState): CountryId | null {
	return getCurrentGameRound(state)?.questionId ?? null
}

export function getGameCurrentQuestionIndex(state: GameState): number | null {
	return getCurrentGameRound(state)?.questionIndex ?? null
}

export function getGameCurrentQuestionNumber(state: GameState): number {
	const currentQuestionIndex = getGameCurrentQuestionIndex(state)
	return currentQuestionIndex === null
		? getGameQuestionCount(state)
		: currentQuestionIndex + 1
}

export function getGameSubmission(
	state: GameState,
	participantId: MemberId,
): LockedSubmission | EvaluatedSubmission | undefined {
	return getCurrentGameRound(state)?.submissions[participantId]
}

export function hasParticipantSubmitted(
	state: GameState,
	participantId: MemberId,
): boolean {
	const submission = getGameSubmission(state, participantId)
	return submission?.countryId !== undefined && submission.countryId !== null
}

export function getAnsweredParticipantCount(state: GameState): number {
	const round = getCurrentGameRound(state)
	if (!round) {
		return 0
	}

	if (state.phase === 'open') {
		return Object.keys(round.submissions).length
	}

	return Object.values(round.submissions).filter(submission => {
		return submission.countryId !== null
	}).length
}

export function getGameLeaderboard(state: GameState): GameLeaderboardEntry[] {
	if (state.phase === 'completed') {
		return state.result.leaderboard
	}

	return createLeaderboard(state.participantsById)
}
