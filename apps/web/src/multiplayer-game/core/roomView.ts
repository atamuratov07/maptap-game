import { countryCatalog, type CountryInfo } from '@maptap/country-catalog'
import type {
	EvaluatedViewerSubmissionState,
	RoomLeaderboardEntry,
	RoomView,
	VisiblePlayerInfo,
} from '@maptap/game-domain/multiplayer'
import type { RoomClosedEvent } from '@maptap/game-protocol'

export function formatClosedReason(reason: RoomClosedEvent['reason']): string {
	if (reason === 'host_terminated') {
		return 'Хост закрыл комнату.'
	}

	if (reason === 'expired') {
		return 'Время комнаты истекло.'
	}

	return 'Комната закрыта.'
}

export function getCountryInfo(
	countryId: string | null | undefined,
): CountryInfo | null {
	if (!countryId) {
		return null
	}

	return countryCatalog.countriesById.get(countryId) ?? null
}

export function getViewerPlayer(room: RoomView): VisiblePlayerInfo | null {
	return (
		room.players.find(player => player.playerId === room.viewerPlayerId) ??
		null
	)
}

export function getViewerLeaderboardEntry(
	room: RoomView,
): RoomLeaderboardEntry | null {
	return (
		room.leaderboard?.find(entry => entry.playerId === room.viewerPlayerId) ??
		null
	)
}

export function getLeaderboard(
	room: RoomView,
	limit = 5,
): RoomLeaderboardEntry[] {
	return room.leaderboard?.slice(0, limit) ?? []
}

export function getSubmissionResultLabel(
	submission: EvaluatedViewerSubmissionState | null,
): string {
	if (!submission || submission.countryId === null) {
		return 'Без ответа'
	}

	return submission.isCorrect ? 'Верно' : 'Неверно'
}
