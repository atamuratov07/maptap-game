import { calculateQuestionScore } from './score'
import type {
	GameAction,
	GameConfig,
	GameState,
	PlayingGameState,
	PreparedGameSession,
	RevealedGameState,
} from './types'

const DEFAULT_CONFIG: GameConfig = {
	questionCount: 10,
	attemptsPerQuestion: 3,
	difficulty: 'easy',
}

function clampAttempts(value: number): number {
	return Math.max(1, Math.floor(value))
}

function elapsedSeconds(start: number, end: number): number {
	return Math.max(0, Math.floor((end - start) / 1000))
}

function assertNever(value: never): never {
	throw new Error(`Unhandled action: ${JSON.stringify(value)}`)
}

function getCurrentQuestionId(state: {
	index: number
	questionIds: string[]
}): string | undefined {
	if (state.index < 0 || state.index >= state.questionIds.length) {
		return undefined
	}

	return state.questionIds[state.index]
}

function createPlayingState(
	session: PreparedGameSession,
	now: number,
): PlayingGameState {
	return {
		phase: 'playing',
		config: session.config,
		questionIds: session.questionIds,
		index: 0,
		attemptsLeft: session.config.attemptsPerQuestion,
		wrongPicks: [],
		score: 0,
		correctCount: 0,
		questionStartedAt: now,
	}
}

function revealCurrentQuestion(
	state: PlayingGameState,
	now: number,
): RevealedGameState {
	const targetId = getCurrentQuestionId(state)
	if (!targetId) {
		throw new Error('Cannot reveal a question without a valid target.')
	}

	return {
		phase: 'revealed',
		config: state.config,
		questionIds: state.questionIds,
		index: state.index,
		attemptsLeft: 0,
		wrongPicks: state.wrongPicks,
		revealedId: targetId,
		score: state.score,
		correctCount: state.correctCount,
		questionStartedAt: state.questionStartedAt,
		questionResolvedAt: now,
	}
}

export function createIdleState(
	configOverride: Partial<GameConfig> = {},
): GameState {
	return {
		phase: 'idle',
		config: {
			...DEFAULT_CONFIG,
			...configOverride,
			attemptsPerQuestion: clampAttempts(
				configOverride.attemptsPerQuestion ??
					DEFAULT_CONFIG.attemptsPerQuestion,
			),
		},
	}
}

export function gameReducer(state: GameState, action: GameAction): GameState {
	switch (action.type) {
		case 'START': {
			if (action.session.questionIds.length === 0) {
				throw new Error('START action requires at least one question.')
			}

			return createPlayingState(action.session, action.now)
		}

		case 'PICK': {
			if (state.phase !== 'playing') {
				return state
			}

			const targetId = getCurrentQuestionId(state)
			if (!targetId) {
				throw new Error('Playing state requires a valid target question.')
			}

			if (action.countryId === targetId) {
				const questionScore = calculateQuestionScore(
					elapsedSeconds(state.questionStartedAt, action.now),
					state.wrongPicks.length,
				)

				return {
					phase: 'revealed',
					config: state.config,
					questionIds: state.questionIds,
					index: state.index,
					attemptsLeft: state.attemptsLeft,
					wrongPicks: state.wrongPicks,
					revealedId: targetId,
					score: state.score + questionScore,
					correctCount: state.correctCount + 1,
					questionStartedAt: state.questionStartedAt,
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
					phase: 'revealed',
					config: state.config,
					questionIds: state.questionIds,
					index: state.index,
					attemptsLeft,
					wrongPicks,
					revealedId: targetId,
					score: state.score,
					correctCount: state.correctCount,
					questionStartedAt: state.questionStartedAt,
					questionResolvedAt: action.now,
				}
			}

			return {
				phase: 'playing',
				config: state.config,
				questionIds: state.questionIds,
				index: state.index,
				attemptsLeft,
				wrongPicks,
				score: state.score,
				correctCount: state.correctCount,
				questionStartedAt: state.questionStartedAt,
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
					phase: 'finished',
					config: state.config,
					questionIds: state.questionIds,
					index: nextIndex,
					score: state.score,
					correctCount: state.correctCount,
					questionStartedAt: state.questionStartedAt,
					questionResolvedAt: state.questionResolvedAt,
				}
			}

			return {
				phase: 'playing',
				config: state.config,
				questionIds: state.questionIds,
				index: nextIndex,
				attemptsLeft: state.config.attemptsPerQuestion,
				wrongPicks: [],
				score: state.score,
				correctCount: state.correctCount,
				questionStartedAt: action.now,
			}
		}
	}

	return assertNever(action)
}
