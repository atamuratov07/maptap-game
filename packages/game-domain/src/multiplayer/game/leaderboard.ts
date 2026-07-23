import type { MemberId } from '../room'
import type { GameLeaderboardEntry, GameParticipantState } from './types'

function compareParticipants(
	left: GameParticipantState,
	right: GameParticipantState,
): number {
	if (right.score !== left.score) {
		return right.score - left.score
	}

	if (right.correctCount !== left.correctCount) {
		return right.correctCount - left.correctCount
	}

	return left.id.localeCompare(right.id)
}
export function createLeaderboard(
	participantsById: Record<MemberId, GameParticipantState>,
): GameLeaderboardEntry[] {
	const rankedParticipants =
		Object.values(participantsById).sort(compareParticipants)

	return rankedParticipants.map((participant, index) => ({
		participantId: participant.id,
		rank: index + 1,
		score: participant.score,
		correctCount: participant.correctCount,
	}))
}
