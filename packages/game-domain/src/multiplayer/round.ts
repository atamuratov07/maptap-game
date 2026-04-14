import type {
	CompletedGameRoundState,
	GameConfig,
	LeaderboardGRoundGameState,
	OpenRoundGameState,
	RevealedRoundGameState,
} from './types'

export function createRound(
	questionIds: string[],
	config: GameConfig,
	questionIndex: number,
	now: number,
): OpenRoundGameState {
	const questionId = questionIds[questionIndex]
	if (!questionId) {
		throw new Error(
			`Question index ${questionIndex} is out of range for this room.`,
		)
	}

	return {
		phase: 'open',
		questionIndex,
		questionId,
		startedAt: now,
		deadlineAt: now + config.questionDurationMs,
		submissions: {},
	}
}

export function archiveRound(
	round: RevealedRoundGameState | LeaderboardGRoundGameState,
): CompletedGameRoundState {
	return {
		questionIndex: round.questionIndex,
		questionId: round.questionId,
		startedAt: round.startedAt,
		deadlineAt: round.deadlineAt,
		revealedAt: round.revealedAt,
		leaderboardShownAt:
			round.phase === 'leaderboard' ? round.leaderboardShownAt : null,
		submissions: round.submissions,
	}
}
