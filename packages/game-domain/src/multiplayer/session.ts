import { selectEligibleCountryIds } from '../catalog/selectors'
import type { CountryPool } from '../catalog/types'
import type { SessionPreparationError } from '../shared/errors'
import { pickRandomIds, type RandomNumberGenerator } from '../shared/random'
import { err, ok, type Result } from '../shared/result'
import type { GameConfig, GameSession } from './types'

function normalizeQuestionCount(
	value: number,
): Result<number, SessionPreparationError> {
	if (!Number.isFinite(value) || Math.floor(value) < 1) {
		return err({
			code: 'invalid_question_count',
		})
	}

	return ok(Math.floor(value))
}

export function prepareGameSession(
	pool: CountryPool,
	config: GameConfig,
	rng: RandomNumberGenerator = Math.random,
): Result<GameSession, SessionPreparationError> {
	const normalizedQuestionCount = normalizeQuestionCount(config.questionCount)
	if (!normalizedQuestionCount.ok) {
		return normalizedQuestionCount
	}
	const eligibleIds = selectEligibleCountryIds(pool, config)
	if (eligibleIds.length === 0) {
		return err({
			code: 'no_eligible_countries',
		})
	}

	const questionIds = pickRandomIds(
		eligibleIds,
		Math.min(normalizedQuestionCount.value, eligibleIds.length),
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
