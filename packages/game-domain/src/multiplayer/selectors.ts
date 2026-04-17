import type {
	ActiveRoundGameState,
	GamePlayerState,
	PlayerId,
	RoomLeaderboardEntry,
	RoomState,
} from './types'

function getActiveRoundState(
	state: RoomState,
): ActiveRoundGameState | undefined {
	return state.phase === 'question_open' ||
		state.phase === 'question_revealed' ||
		state.phase === 'leaderboard'
		? state.activeRound
		: undefined
}

function comparePlayers(left: GamePlayerState, right: GamePlayerState): number {
	if (right.score !== left.score) {
		return right.score - left.score
	}

	if (right.correctCount !== left.correctCount) {
		return right.correctCount - left.correctCount
	}

	if (left.joinedAt !== right.joinedAt) {
		return left.joinedAt - right.joinedAt
	}

	const nameCompare = left.name.localeCompare(right.name)
	if (nameCompare !== 0) {
		return nameCompare
	}

	return left.id.localeCompare(right.id)
}

export function getPlayer(
	state: RoomState,
	playerId: PlayerId,
): GamePlayerState | undefined {
	return state.playersById[playerId]
}

export function getPlayers(state: RoomState): GamePlayerState[] {
	return state.playerOrder.flatMap(playerId => {
		const player = state.playersById[playerId]
		return player ? [player] : []
	})
}

export function getActiveRound(
	state: RoomState,
): ActiveRoundGameState | undefined {
	return getActiveRoundState(state)
}

export function getCurrentQuestionId(state: RoomState): string | undefined {
	return getActiveRoundState(state)?.questionId
}

export function getCurrentQuestionIndex(state: RoomState): number {
	const activeRound = getActiveRoundState(state)
	if (activeRound) {
		return activeRound.questionIndex
	}

	return state.phase === 'finished' ? state.gameSession.questionIds.length : 0
}

export function getCurrentQuestionNumber(state: RoomState): number {
	const activeRound = getActiveRoundState(state)
	if (activeRound) {
		return activeRound.questionIndex + 1
	}

	return state.phase === 'finished' ? state.gameSession.questionIds.length : 0
}

export function getQuestionCount(state: RoomState): number {
	return state.gameSession.questionIds.length
}

export function getConnectedPlayerCount(state: RoomState): number {
	return getPlayers(state).filter(player => player.connected).length
}

export function getAnsweredPlayerCount(state: RoomState): number {
	const activeRound = getActiveRoundState(state)
	if (!activeRound) {
		return 0
	}

	if (activeRound.phase === 'open') {
		return Object.keys(activeRound.submissions).length
	}

	return Object.values(activeRound.submissions).filter(submission => {
		return submission.countryId !== null
	}).length
}

export function hasPlayerSubmitted(
	state: RoomState,
	playerId: PlayerId,
): boolean {
	const submission = getPlayerSubmission(state, playerId)
	if (!submission) {
		return false
	}

	return submission.countryId !== null
}

export function getPlayerSubmission(state: RoomState, playerId: PlayerId) {
	const activeRound = getActiveRoundState(state)
	return activeRound?.submissions[playerId]
}

export function getLeaderboard(state: RoomState): RoomLeaderboardEntry[] {
	const rankedPlayers = [...getPlayers(state)].sort(comparePlayers)

	return rankedPlayers.map((player, index) => ({
		rank: index + 1,
		playerId: player.id,
		name: player.name,
		role: player.role,
		connected: player.connected,
		score: player.score,
		correctCount: player.correctCount,
	}))
}
