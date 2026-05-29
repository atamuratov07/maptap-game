import type { GameDifficulty, GameScope } from '@maptap/game-domain'
import type { TFunction } from 'i18next'

export function getDifficultyLabel(
	t: TFunction,
	difficulty: GameDifficulty,
): string {
	return t(`game.difficulty.${difficulty}`)
}

export function getScopeLabel(t: TFunction, scope: GameScope): string {
	return t(`game.scope.${scope}`)
}
