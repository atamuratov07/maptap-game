import type { GameDifficulty, GameScope } from '@maptap/game-domain'
import {
	DEFAULT_GAME_CONFIG,
	type GameConfig,
} from '@maptap/game-domain/multiplayer'

export const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const
export const QUESTION_DURATION_MS_OPTIONS = [
	15_000, 20_000, 30_000, 45_000, 60_000,
] as const

export const DIFFICULTY_OPTIONS: Array<{
	value: GameDifficulty
}> = [{ value: 'easy' }, { value: 'medium' }, { value: 'hard' }]

export const SCOPE_OPTIONS: Array<{
	value: GameScope
}> = [
	{ value: 'all' },
	{ value: 'africa' },
	{ value: 'asia' },
	{ value: 'europe' },
	{ value: 'north-america' },
	{ value: 'south-america' },
	{ value: 'oceania' },
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

function normalizeGameConfig(value: unknown): GameConfig {
	if (!value || typeof value !== 'object') {
		return DEFAULT_GAME_CONFIG
	}

	const draft = value as Partial<GameConfig>

	return {
		questionCount: includesValue(QUESTION_COUNT_OPTIONS, draft.questionCount)
			? draft.questionCount
			: DEFAULT_GAME_CONFIG.questionCount,
		questionDurationMs:
			includesValue(
				QUESTION_DURATION_MS_OPTIONS,
				draft.questionDurationMs,
			) || draft.questionDurationMs === undefined
				? draft.questionDurationMs
				: DEFAULT_GAME_CONFIG.questionDurationMs,
		difficulty: includesValue(
			DIFFICULTY_OPTIONS.map(option => option.value),
			draft.difficulty,
		)
			? draft.difficulty
			: DEFAULT_GAME_CONFIG.difficulty,
		scope: includesValue(
			SCOPE_OPTIONS.map(option => option.value),
			draft.scope,
		)
			? draft.scope
			: DEFAULT_GAME_CONFIG.scope,
	}
}

function canUseLocalStorage(): boolean {
	return typeof localStorage !== 'undefined'
}

export function loadRoomGameConfig(roomCode: string): GameConfig {
	if (!canUseLocalStorage()) {
		return DEFAULT_GAME_CONFIG
	}

	try {
		const rawValue = localStorage.getItem(getConfigStorageKey(roomCode))
		return rawValue
			? normalizeGameConfig(JSON.parse(rawValue))
			: DEFAULT_GAME_CONFIG
	} catch {
		return DEFAULT_GAME_CONFIG
	}
}

export function saveRoomGameConfig(roomCode: string, config: GameConfig): void {
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
