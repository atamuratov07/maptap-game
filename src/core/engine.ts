export type GamePhase = 'home' | 'playing' | 'revealed' | 'finished'

export type RendererKind = 'svg' | 'mapbox'

export interface GameConfig {
	questionCount: number
	rendererKind: RendererKind
	attemptsPerQuestion: number
}

export interface GameState {
	phase: GamePhase
	config: GameConfig
	questionIds: string[]
	index: number
	attemptsLeft: number
	wrongPicks: string[]
	revealedId?: string
	score: number
	correctCount: number
	gameStartedAt: number
	questionStartedAt: number
	questionResolvedAt?: number
}

export type GameAction =
	| {
			type: 'START'
			config: GameConfig
			questionIds: string[]
			now: number
	  }
	| {
			type: 'PICK'
			countryId: string
			now: number
	  }
	| {
			type: 'GIVE_UP'
			now: number
	  }
	| {
			type: 'NEXT'
			now: number
	  }
	| {
			type: 'HOME'
	  }

const DEFAULT_CONFIG: GameConfig = {
	questionCount: 10,
	rendererKind: 'svg',
	attemptsPerQuestion: 3,
}

function clampAttempts(value: number): number {
	return Math.max(1, Math.floor(value))
}

function elapsedSeconds(start: number, end: number): number {
	return Math.max(0, Math.floor((end - start) / 1000))
}

function calculateQuestionScore(
	secondsElapsed: number,
	wrongPickCount: number,
): number {
	const totalPenalty = secondsElapsed * 5 + wrongPickCount * 20
	return Math.max(0, 100 - totalPenalty)
}

function revealCurrentQuestion(state: GameState, now: number): GameState {
	const targetId = getTargetId(state)
	if (!targetId) {
		return state
	}

	return {
		...state,
		phase: 'revealed',
		revealedId: targetId,
		attemptsLeft: 0,
		questionResolvedAt: now,
	}
}

export function createHomeState(
	configOverride: Partial<GameConfig> = {},
): GameState {
	const config: GameConfig = {
		...DEFAULT_CONFIG,
		...configOverride,
		attemptsPerQuestion: clampAttempts(
			configOverride.attemptsPerQuestion ??
				DEFAULT_CONFIG.attemptsPerQuestion,
		),
	}

	return {
		phase: 'home',
		config,
		questionIds: [],
		index: 0,
		attemptsLeft: config.attemptsPerQuestion,
		wrongPicks: [],
		revealedId: undefined,
		score: 0,
		correctCount: 0,
		gameStartedAt: 0,
		questionStartedAt: 0,
		questionResolvedAt: undefined,
	}
}

export function getTargetId(state: GameState): string | undefined {
	if (state.index < 0 || state.index >= state.questionIds.length) {
		return undefined
	}

	return state.questionIds[state.index]
}

export function isCountryWrong(state: GameState, countryId: string): boolean {
	return state.wrongPicks.includes(countryId)
}

export function isCountryRevealed(
	state: GameState,
	countryId: string,
): boolean {
	return (
		state.revealedId === countryId &&
		(state.phase === 'revealed' || state.phase === 'finished')
	)
}

export function isPickAllowed(state: GameState): boolean {
	return state.phase === 'playing'
}

export function gameReducer(state: GameState, action: GameAction): GameState {
	switch (action.type) {
		case 'START': {
			const attemptsPerQuestion = clampAttempts(
				action.config.attemptsPerQuestion,
			)
			const cappedCount = Math.max(
				0,
				Math.min(action.config.questionCount, action.questionIds.length),
			)
			const nextQuestionIds = action.questionIds.slice(0, cappedCount)

			if (nextQuestionIds.length === 0) {
				return createHomeState({
					questionCount: action.config.questionCount,
					rendererKind: action.config.rendererKind,
					attemptsPerQuestion,
				})
			}

			return {
				phase: 'playing',
				config: {
					questionCount: nextQuestionIds.length,
					rendererKind: action.config.rendererKind,
					attemptsPerQuestion,
				},
				questionIds: nextQuestionIds,
				index: 0,
				attemptsLeft: attemptsPerQuestion,
				wrongPicks: [],
				revealedId: undefined,
				score: 0,
				correctCount: 0,
				gameStartedAt: action.now,
				questionStartedAt: action.now,
				questionResolvedAt: undefined,
			}
		}

		case 'PICK': {
			if (state.phase !== 'playing') {
				return state
			}

			const targetId = getTargetId(state)
			if (!targetId) {
				return state
			}

			if (action.countryId === targetId) {
				const questionScore = calculateQuestionScore(
					elapsedSeconds(state.questionStartedAt, action.now),
					state.wrongPicks.length,
				)

				return {
					...state,
					phase: 'revealed',
					revealedId: targetId,
					score: state.score + questionScore,
					correctCount: state.correctCount + 1,
					questionResolvedAt: action.now,
				}
			}

			if (state.wrongPicks.includes(action.countryId)) {
				return state
			}

			const wrongPicks = [...state.wrongPicks, action.countryId]
			const attemptsLeft = Math.max(0, state.attemptsLeft - 1)

			if (attemptsLeft === 0) {
				return {
					...state,
					phase: 'revealed',
					attemptsLeft,
					wrongPicks,
					revealedId: targetId,
					questionResolvedAt: action.now,
				}
			}

			return {
				...state,
				attemptsLeft,
				wrongPicks,
			}
		}

		case 'GIVE_UP': {
			if (state.phase !== 'playing') {
				return state
			}

			return revealCurrentQuestion(state, action.now)
		}

		case 'NEXT': {
			if (state.phase !== 'revealed') {
				return state
			}

			const nextIndex = state.index + 1
			if (nextIndex >= state.questionIds.length) {
				return {
					...state,
					phase: 'finished',
					index: nextIndex,
					attemptsLeft: 0,
					wrongPicks: [],
					revealedId: undefined,
					questionResolvedAt: action.now,
				}
			}

			return {
				...state,
				phase: 'playing',
				index: nextIndex,
				attemptsLeft: state.config.attemptsPerQuestion,
				wrongPicks: [],
				revealedId: undefined,
				questionStartedAt: action.now,
				questionResolvedAt: undefined,
			}
		}

		case 'HOME': {
			return createHomeState({
				questionCount: state.config.questionCount,
				rendererKind: state.config.rendererKind,
				attemptsPerQuestion: state.config.attemptsPerQuestion,
			})
		}

		default:
			return state
	}
}
