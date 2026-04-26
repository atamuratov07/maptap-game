import { countryCatalog, type CountryInfo } from '@maptap/country-catalog'
import type {
	GameLeaderboardEntry,
	GameResult,
	GameView,
} from '@maptap/game-domain/multiplayer-next/game'
import type { VisibleMemberInfo } from '@maptap/game-domain/multiplayer-next/room'
import { getMemberName } from './roomSelectors'

export interface CurrentRoundView {
	startedAt: number
	deadlineAt: number
	questionCountryId: string
	currentQuestionNumber: number
	questionCount: number
}

export interface NamedLeaderboardEntry extends GameLeaderboardEntry {
	name: string
}

export function getLeaderboardEntries(
	game: Pick<GameView, 'leaderboard'> | Pick<GameResult, 'leaderboard'>,
	members: readonly VisibleMemberInfo[],
	limit?: number,
): NamedLeaderboardEntry[] {
	const entries = game.leaderboard ?? []
	const visibleEntries = limit === undefined ? entries : entries.slice(0, limit)

	return visibleEntries.map(entry => ({
		...entry,
		name: getMemberName(members, entry.participantId),
	}))
}

export function getCurrentRound(game: GameView): CurrentRoundView | null {
	if (game.phase === 'completed') {
		return null
	}

	return {
		startedAt: game.startedAt,
		deadlineAt: game.deadlineAt,
		questionCountryId: game.questionCountryId,
		currentQuestionNumber: game.currentQuestionNumber,
		questionCount: game.questionCount,
	}
}

export function getCountryInfo(
	countryId: string | null | undefined,
): CountryInfo | null {
	if (!countryId) {
		return null
	}

	return countryCatalog.countriesById.get(countryId) ?? null
}

export function getPromptCountryInfo(game: GameView): CountryInfo | null {
	return game.phase === 'open'
		? getCountryInfo(game.questionCountryId)
		: null
}

export function getCorrectCountryInfo(game: GameView): CountryInfo | null {
	return game.phase === 'revealed' || game.phase === 'leaderboard'
		? getCountryInfo(game.correctCountryId)
		: null
}

export function getTargetCountryInfo(game: GameView): CountryInfo | null {
	return game.phase === 'open'
		? getPromptCountryInfo(game)
		: getCorrectCountryInfo(game)
}
