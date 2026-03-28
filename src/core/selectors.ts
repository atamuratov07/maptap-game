import type { GameState } from './types'

export function getTargetId(state: GameState): string | undefined {
	if (state.index < 0 || state.index >= state.questionIds.length) {
		return undefined
	}

	return state.questionIds[state.index]
}

export function getRevealedId(state: GameState): string | undefined {
	return state.revealedId
}

export function getQuestionCount(state: GameState): number {
	return state.questionIds.length
}

export function getQuestionIndex(state: GameState): number {
	return state.index
}

export function getWrongPicks(state: GameState): string[] {
	return state.wrongPicks
}

export function getAttemptsLeft(state: GameState): number {
	return state.attemptsLeft
}

export function getQuestionStartedAt(state: GameState): number {
	return state.questionStartedAt
}

export function getQuestionResolvedAt(state: GameState): number | undefined {
	return state.questionResolvedAt
}

export function getScore(state: GameState): number {
	return state.score
}

export function getCorrectCount(state: GameState): number {
	return state.correctCount
}

export function isPickAllowed(state: GameState): boolean {
	return state.phase === 'playing'
}
