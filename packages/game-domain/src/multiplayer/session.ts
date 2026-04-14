import { selectEligibleCountryIds } from '../catalog/selectors'
import type { CountryPool } from '../catalog/types'
import type { SessionPreparationError } from '../shared/errors'
import { pickRandomIds, type RandomNumberGenerator } from '../shared/random'
import { err, ok, type Result } from '../shared/result'
import type { GameConfig, GameSession } from './types'

export function prepareGameSession(
	pool: CountryPool,
	config: GameConfig,
	rng: RandomNumberGenerator = Math.random,
): Result<GameSession, SessionPreparationError> {
	const eligibleIds = selectEligibleCountryIds(pool, config)
	if (eligibleIds.length === 0) {
		return err({
			code: 'no_eligible_countries',
		})
	}

	if (eligibleIds.length < config.questionCount) {
		return err({
			code: 'insufficient_eligible_countries',
			questionCount: config.questionCount,
			countryCount: eligibleIds.length,
		})
	}

	const questionIds = pickRandomIds(
		eligibleIds,
		config.questionCount,
		rng,
	)

	return ok({
		config: {
			questionCount: questionIds.length,
			difficulty: config.difficulty,
			scope: config.scope,
			questionDurationMs: config.questionDurationMs,
		},
		eligibleIds,
		questionIds,
	})
}
