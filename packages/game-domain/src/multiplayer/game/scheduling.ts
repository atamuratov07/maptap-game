import type { GameState } from './types'

export interface GameAdvanceScheduleConfig {
	revealDurationMs?: number
	leaderboardDurationMs?: number
}

export function getNextGameAdvanceAt(
	game: GameState,
	config: GameAdvanceScheduleConfig,
): number | null {
	switch (game.phase) {
		case 'open':
			return game.currentRound.deadlineAt

		case 'revealed':
			if (!config.revealDurationMs) {
				return null
			}
			return game.currentRound.revealedAt + config.revealDurationMs

		case 'leaderboard':
			if (!config.leaderboardDurationMs) {
				return null
			}
			return (
				game.currentRound.leaderboardShownAt + config.leaderboardDurationMs
			)

		case 'completed':
			return null
	}
}
