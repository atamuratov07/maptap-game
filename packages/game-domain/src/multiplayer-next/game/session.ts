import { selectEligibleCountryIds } from '../../catalog/selectors'
import type { CountryPool } from '../../catalog/types'
import type { SessionPreparationError } from '../errors'
import { pickRandomIds, type RandomNumberGenerator } from '../../shared/random'
import { err, ok, type Result } from '../../shared/result'
import { TASHKENT_CITY_QUESTIONS } from './quiz/content/tashkent-city'
import { UZBEKISTAN_GEOGRAPHY_QUESTIONS } from './quiz/content/uzbekistan-geography'
import type {
	CountryMapGameConfig,
	GameConfig,
	GameSession,
	MapPickCountryQuestion,
	QuizGameConfig,
	QuizChoiceQuestion,
} from './types'

function prepareCountryMapGameSession(
	pool: CountryPool,
	config: CountryMapGameConfig,
	rng: RandomNumberGenerator,
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

	const questionIds = pickRandomIds(eligibleIds, config.questionCount, rng)
	const questions: MapPickCountryQuestion[] = questionIds.map(questionId => ({
		kind: 'map_pick_country',
		id: questionId,
		promptCountryId: questionId,
		correctCountryId: questionId,
		eligibleAnswerIds: eligibleIds,
	}))

	return ok({
		gameKind: 'country-map',
		config: {
			gameKind: 'country-map',
			questionCount: questionIds.length,
			difficulty: config.difficulty,
			scope: config.scope,
			questionDurationMs: config.questionDurationMs,
		},
		eligibleIds,
		questionIds,
		questions,
	})
}

function getQuizQuestions(
	config: QuizGameConfig,
): readonly QuizChoiceQuestion[] {
	switch (config.packId) {
		case 'tashkent-city':
			return TASHKENT_CITY_QUESTIONS
		case 'uzbekistan-geography':
			return UZBEKISTAN_GEOGRAPHY_QUESTIONS
	}
}

function prepareQuizGameSession(
	config: QuizGameConfig,
	rng: RandomNumberGenerator,
): Result<GameSession, SessionPreparationError> {
	const questionBank = getQuizQuestions(config)

	if (questionBank.length < config.questionCount) {
		return err({
			code: 'insufficient_questions',
			questionCount: config.questionCount,
			availableQuestionCount: questionBank.length,
		})
	}

	const questions = pickRandomIds(questionBank, config.questionCount, rng)

	return ok({
		gameKind: 'quiz',
		config: {
			gameKind: 'quiz',
			packId: config.packId,
			questionCount: questions.length,
			questionDurationMs: config.questionDurationMs,
		},
		eligibleIds: [],
		questionIds: questions.map(question => question.id),
		questions,
	})
}

export function prepareGameSession(
	pool: CountryPool,
	config: GameConfig,
	rng: RandomNumberGenerator = Math.random,
): Result<GameSession, SessionPreparationError> {
	if (config.gameKind === 'quiz') {
		return prepareQuizGameSession(config, rng)
	}

	return prepareCountryMapGameSession(pool, config, rng)
}
