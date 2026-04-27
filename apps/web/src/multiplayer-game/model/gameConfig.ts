import type { GameDifficulty, GameScope } from '@maptap/game-domain'
import {
	DEFAULT_COUNTRY_MAP_GAME_CONFIG,
	QUIZ_QUESTION_PACK_IDS,
	type CountryMapGameConfig,
	type GameConfig,
	type QuizGameConfig,
	type QuizQuestionPackId,
} from '@maptap/game-domain/multiplayer-next'

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const
export const QUESTION_DURATION_MS_OPTIONS = [
	15_000, 20_000, 30_000, 45_000, 60_000,
] as const

export const DIFFICULTY_OPTIONS: Array<{
	value: GameDifficulty
	label: string
}> = [
	{ value: 'easy', label: 'Лёгкая' },
	{ value: 'medium', label: 'Средняя' },
	{ value: 'hard', label: 'Сложная' },
]

export const SCOPE_OPTIONS: Array<{
	value: GameScope
	label: string
}> = [
	{ value: 'all', label: 'Весь мир' },
	{ value: 'africa', label: 'Африка' },
	{ value: 'asia', label: 'Азия' },
	{ value: 'europe', label: 'Европа' },
	{ value: 'north-america', label: 'Северная Америка' },
	{ value: 'south-america', label: 'Южная Америка' },
	{ value: 'oceania', label: 'Океания' },
]

export const QUIZ_PACK_OPTIONS: Array<{
	value: QuizQuestionPackId
	label: string
}> = [
	{ value: 'uzbekistan-geography', label: 'География Узбекистана' },
	{ value: 'tashkent-city', label: 'Ташкент: город и места' },
]

const CONFIG_STORAGE_PREFIX = 'maptap.multiplayer.gameConfig'

function getConfigStorageKey(roomCode: string): string {
	return `${CONFIG_STORAGE_PREFIX}.${roomCode.trim().toUpperCase()}`
}

function includesValue<TValue extends string | number>(
	values: readonly TValue[],
	value: unknown,
): value is TValue {
	return values.includes(value as TValue)
}

function normalizeQuestionCount(value: unknown): GameConfig['questionCount'] {
	return includesValue(QUESTION_COUNT_OPTIONS, value)
		? value
		: DEFAULT_COUNTRY_MAP_GAME_CONFIG.questionCount
}

function normalizeQuestionDuration(
	value: unknown,
): GameConfig['questionDurationMs'] {
	return includesValue(QUESTION_DURATION_MS_OPTIONS, value)
		? value
		: DEFAULT_COUNTRY_MAP_GAME_CONFIG.questionDurationMs
}

function normalizeQuizGameConfig(value: Partial<QuizGameConfig>): QuizGameConfig {
	return {
		gameKind: 'quiz',
		packId: includesValue(QUIZ_QUESTION_PACK_IDS, value.packId)
			? value.packId
			: 'uzbekistan-geography',
		questionCount: normalizeQuestionCount(value.questionCount),
		questionDurationMs: normalizeQuestionDuration(value.questionDurationMs),
	}
}

function normalizeCountryMapGameConfig(
	value: Partial<CountryMapGameConfig>,
): CountryMapGameConfig {
	return {
		gameKind: 'country-map',
		questionCount: normalizeQuestionCount(value.questionCount),
		questionDurationMs: normalizeQuestionDuration(value.questionDurationMs),
		difficulty: includesValue(
			DIFFICULTY_OPTIONS.map(option => option.value),
			value.difficulty,
		)
			? value.difficulty
			: DEFAULT_COUNTRY_MAP_GAME_CONFIG.difficulty,
		scope: includesValue(
			SCOPE_OPTIONS.map(option => option.value),
			value.scope,
		)
			? value.scope
			: DEFAULT_COUNTRY_MAP_GAME_CONFIG.scope,
	}
}

function normalizeGameConfig(value: unknown): GameConfig {
	if (!value || typeof value !== 'object') {
		return DEFAULT_COUNTRY_MAP_GAME_CONFIG
	}

	const draft = value as Partial<GameConfig>

	return draft.gameKind === 'quiz'
		? normalizeQuizGameConfig(draft as Partial<QuizGameConfig>)
		: normalizeCountryMapGameConfig(draft as Partial<CountryMapGameConfig>)
}

function canUseLocalStorage(): boolean {
	return typeof localStorage !== 'undefined'
}

export function loadRoomGameConfig(roomCode: string): GameConfig {
	if (!canUseLocalStorage()) {
		return DEFAULT_COUNTRY_MAP_GAME_CONFIG
	}

	try {
		const rawValue = localStorage.getItem(getConfigStorageKey(roomCode))
		return rawValue
			? normalizeGameConfig(JSON.parse(rawValue))
			: DEFAULT_COUNTRY_MAP_GAME_CONFIG
	} catch {
		return DEFAULT_COUNTRY_MAP_GAME_CONFIG
	}
}

export function saveRoomGameConfig(
	roomCode: string,
	config: GameConfig,
): void {
	if (!canUseLocalStorage()) {
		return
	}

	localStorage.setItem(
		getConfigStorageKey(roomCode),
		JSON.stringify(normalizeGameConfig(config)),
	)
}

export function clearRoomGameConfig(roomCode: string): void {
	if (!canUseLocalStorage()) {
		return
	}

	localStorage.removeItem(getConfigStorageKey(roomCode))
}
