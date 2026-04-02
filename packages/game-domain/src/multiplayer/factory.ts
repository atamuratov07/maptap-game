import type { CommandError, SessionPreparationError } from '../shared/errors'
import { err, ok, type Result } from '../shared/result'
import type { CreateGameRoomInput, GameRoomState } from './types'

export function normalizePlayerName(name: string): string {
	return name.trim()
}

export function createGameRoom(
	input: CreateGameRoomInput,
): Result<GameRoomState, CommandError | SessionPreparationError> {
	const hostName = normalizePlayerName(input.hostName)
	if (hostName.length === 0) {
		return err({
			code: 'player_name_required',
		})
	}

	if (input.session.questionIds.length === 0) {
		return err({
			code: 'no_eligible_countries',
		})
	}

	return ok({
		phase: 'lobby',
		roomId: input.roomId,
		roomCode: input.roomCode,
		hostPlayerId: input.hostPlayerId,
		config: input.session.config,
		questionIds: input.session.questionIds,
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
