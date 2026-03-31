import type { GameSessionError } from './errors'
import { pickRandomIds, type RandomNumberGenerator } from './random'
import type {
	GameConfig,
	GameDifficulty,
	GameSession,
	SessionCountryPool,
} from './types'

const DIFFICULTY_RANK: Record<GameDifficulty, number> = {
	easy: 0,
	medium: 1,
	hard: 2,
}

function clampAttempts(value: number): number {
	return Math.max(1, Math.floor(value))
}

function clampQuestionCount(value: number): number {
	return Math.max(0, Math.floor(value))
}

function normalizeConfig(
	config: GameConfig,
	questionCount: number,
): GameConfig {
	return {
		questionCount,
		attemptsPerQuestion: clampAttempts(config.attemptsPerQuestion),
		difficulty: config.difficulty,
		scope: config.scope,
	}
}

export function selectEligibleIds(
	pool: SessionCountryPool,
	config: GameConfig,
): string[] {
	return Array.from(pool.countriesById.entries())
		.filter(([_, countryInfo]) => {
			return (
				countryInfo &&
				(config.scope === 'all' ||
					countryInfo.continent === config.scope) &&
				DIFFICULTY_RANK[countryInfo.difficulty] <=
					DIFFICULTY_RANK[config.difficulty]
			)
		})
		.map(entry => entry[0])
}

export type PrepareGameSessionResult =
	| {
			ok: true
			session: GameSession
	  }
	| {
			ok: false
			error: GameSessionError
	  }

export function prepareGameSession(
	pool: SessionCountryPool,
	config: GameConfig,
	rng: RandomNumberGenerator = Math.random,
): PrepareGameSessionResult {
	const eligibleIds = selectEligibleIds(pool, config)
	const questionIds = pickRandomIds(
		eligibleIds,
		clampQuestionCount(config.questionCount),
		rng,
	)

	if (questionIds.length === 0) {
		return {
			ok: false,
			error: {
				code: 'no_eligible_countries',
			},
		}
	}

	return {
		ok: true,
		session: {
			config: normalizeConfig(config, questionIds.length),
			eligibleIds,
			questionIds,
		},
	}
}
