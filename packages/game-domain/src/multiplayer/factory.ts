import type { CommandError, SessionPreparationError } from '../shared/errors'
import { err, ok, type Result } from '../shared/result'
import type {
	GameSession,
	PlayerId,
	RoomCode,
	RoomId,
	RoomState,
} from './types'

export function normalizePlayerName(name: string): string {
	return name.trim()
}

export interface CreateRoomInput {
	roomId: RoomId
	roomCode: RoomCode
	hostPlayerId: PlayerId
	hostName: string
	session: GameSession
	now: number
}

export function createGameRoom(
	input: CreateRoomInput,
): Result<RoomState, CommandError | SessionPreparationError> {
	const hostName = normalizePlayerName(input.hostName)
	if (hostName.length === 0) {
		return err({
			code: 'player_name_required',
		})
	}

	if (
		input.session.questionIds.length === 0 ||
		input.session.eligibleIds.length === 0
	) {
		return err({
			code: 'no_eligible_countries',
		})
	}

	for (const id of input.session.questionIds) {
		if (!input.session.eligibleIds.includes(id)) {
			return err({
				code: 'country_not_eligible',
			})
		}
	}

	return ok({
		phase: 'lobby',
		roomId: input.roomId,
		roomCode: input.roomCode,
		hostPlayerId: input.hostPlayerId,
		gameSession: input.session,
		playersById: {
			[input.hostPlayerId]: {
				id: input.hostPlayerId,
				name: hostName,
				role: 'host',
				connected: true,
				joinedAt: input.now,
				lastConnectedAt: input.now,
				lastDisconnectedAt: null,
				score: 0,
				correctCount: 0,
			},
		},
		playerOrder: [input.hostPlayerId],
		createdAt: input.now,
		completedRounds: [],
	})
}
