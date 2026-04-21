import type { GameState } from './types'

export interface GameAdvanceScheduleConfig {
	revealDurationMs: number
	leaderboardDurationMs: number
}

export function getNextGameAdvanceAt(
	game: GameState,
	config: GameAdvanceScheduleConfig,
	now: number,
): number | null {
	switch (game.phase) {
		case 'open':
			return game.currentRound.deadlineAt

		case 'revealed':
			return game.currentRound.revealedAt + config.revealDurationMs

		case 'leaderboard':
			return (
				game.currentRound.leaderboardShownAt + config.leaderboardDurationMs
			)

		case 'completed':
			return now
	}
}
