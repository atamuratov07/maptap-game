import type {
	GameState,
	PlayingGameState,
	RevealedGameState,
	StartedGameState,
} from './types'

function isStartedGameState(state: GameState): state is StartedGameState {
	return state.phase !== 'idle'
}

function isQuestionGameState(
	state: GameState,
): state is PlayingGameState | RevealedGameState {
	return state.phase === 'playing' || state.phase === 'revealed'
}

export function getTargetId(state: GameState): string | undefined {
	if (!isQuestionGameState(state)) {
		return undefined
	}

	return state.questionIds[state.index]
}

export function getRevealedId(state: GameState): string | undefined {
	return state.phase === 'revealed' ? getTargetId(state) : undefined
}

export function getQuestionCount(state: GameState): number {
	return isStartedGameState(state) ? state.questionIds.length : 0
}

export function getQuestionIndex(state: GameState): number {
	return isStartedGameState(state) ? state.index : 0
}

export function getAnsweredQuestionCount(state: GameState): number {
	if (!isStartedGameState(state)) {
		return 0
	}

	if (state.phase === 'playing') {
		return state.index
	}

	if (state.phase === 'revealed') {
		return state.index + 1
	}

	return state.questionIds.length
}

export function getWrongPicks(state: GameState): string[] {
	return isQuestionGameState(state) ? state.wrongPicks : []
}

export function getAttemptsLeft(state: GameState): number {
	return isQuestionGameState(state)
		? Math.max(0, state.config.attemptsPerQuestion - state.wrongPicks.length)
		: 0
}

export function getQuestionStartedAt(state: GameState): number {
	return isQuestionGameState(state) ? state.questionStartedAt : 0
}

export function getQuestionResolvedAt(
	state: GameState,
): number | undefined {
	return state.phase === 'revealed' || state.phase === 'finished'
		? state.questionResolvedAt
		: undefined
}

export function getFinishedAt(state: GameState): number | undefined {
	return state.phase === 'finished' ? state.finishedAt : undefined
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
