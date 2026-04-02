import type {
	ActiveGameRoundState,
	GameLeaderboardEntry,
	GamePlayerState,
	GameRoomState,
	PlayerId,
} from './types'

function getActiveRoundState(
	state: GameRoomState,
): ActiveGameRoundState | undefined {
	return state.phase === 'question_open' ||
		state.phase === 'question_revealed' ||
		state.phase === 'leaderboard'
		? state.activeRound
		: undefined
}

function comparePlayers(
	left: GamePlayerState,
	right: GamePlayerState,
): number {
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
	state: GameRoomState,
	playerId: PlayerId,
): GamePlayerState | undefined {
	return state.playersById[playerId]
}

export function getPlayers(state: GameRoomState): GamePlayerState[] {
	return state.playerOrder.flatMap(playerId => {
		const player = state.playersById[playerId]
		return player ? [player] : []
	})
}

export function getActiveRound(
	state: GameRoomState,
): ActiveGameRoundState | undefined {
	return getActiveRoundState(state)
}

export function getCurrentQuestionId(state: GameRoomState): string | undefined {
	return getActiveRoundState(state)?.questionId
}

export function getCurrentQuestionIndex(state: GameRoomState): number {
	const activeRound = getActiveRoundState(state)
	if (activeRound) {
		return activeRound.questionIndex
	}

	return state.phase === 'finished' ? state.questionIds.length : 0
}

export function getCurrentQuestionNumber(state: GameRoomState): number {
	const activeRound = getActiveRoundState(state)
	if (activeRound) {
		return activeRound.questionIndex + 1
	}

	return state.phase === 'finished' ? state.questionIds.length : 0
}

export function getQuestionCount(state: GameRoomState): number {
	return state.questionIds.length
}

export function getConnectedPlayerCount(state: GameRoomState): number {
	return getPlayers(state).filter(player => player.connected).length
}

export function getAnsweredPlayerCount(state: GameRoomState): number {
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
	state: GameRoomState,
	playerId: PlayerId,
): boolean {
	const submission = getPlayerSubmission(state, playerId)
	if (!submission) {
		return false
	}

	return submission.countryId !== null
}

export function getPlayerSubmission(
	state: GameRoomState,
	playerId: PlayerId,
) {
	const activeRound = getActiveRoundState(state)
	return activeRound?.submissions[playerId]
}

export function getLeaderboard(
	state: GameRoomState,
): GameLeaderboardEntry[] {
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
