import type { GameState, StartedGameState } from './types'

function isStartedGameState(state: GameState): state is StartedGameState {
	return state.phase !== 'idle'
}

export function getTargetId(state: GameState): string | undefined {
	if (!isStartedGameState(state)) {
		return undefined
	}

	if (state.index < 0 || state.index >= state.questionIds.length) {
		return undefined
	}

	return state.questionIds[state.index]
}

export function getRevealedId(state: GameState): string | undefined {
	return state.phase === 'revealed' ? state.revealedId : undefined
}

export function getQuestionCount(state: GameState): number {
	return isStartedGameState(state) ? state.questionIds.length : 0
}

export function getQuestionIndex(state: GameState): number {
	return isStartedGameState(state) ? state.index : 0
}

export function getWrongPicks(state: GameState): string[] {
	return state.phase === 'playing' || state.phase === 'revealed'
		? state.wrongPicks
		: []
}

export function getAttemptsLeft(state: GameState): number {
	return state.phase === 'playing' || state.phase === 'revealed'
		? state.attemptsLeft
		: 0
}

export function getQuestionStartedAt(state: GameState): number {
	return isStartedGameState(state) ? state.questionStartedAt : 0
}

export function getQuestionResolvedAt(state: GameState): number | undefined {
	return state.phase === 'revealed' || state.phase === 'finished'
		? state.questionResolvedAt
		: undefined
}

export function getScore(state: GameState): number {
	return isStartedGameState(state) ? state.score : 0
}

export function getCorrectCount(state: GameState): number {
	return isStartedGameState(state) ? state.correctCount : 0
}

export function isPickAllowed(state: GameState): boolean {
	return state.phase === 'playing'
}
