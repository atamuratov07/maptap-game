import type { CommandError } from '../shared/errors'
import { err, ok, type Result } from '../shared/result'
import type { GamePlayerState, PlayerId, RoomState } from './types'

export function canUsePlayerName(
	state: RoomState,
	playerName: string,
): boolean {
	const normalizedPlayerName = playerName.toLocaleLowerCase()

	return !Object.values(state.playersById).some(player => {
		return player.name.toLocaleLowerCase() === normalizedPlayerName
	})
}

export function requirePlayer(
	state: RoomState,
	playerId: PlayerId,
): Result<GamePlayerState, CommandError> {
	const player = state.playersById[playerId]

	return player ? ok(player) : err({ code: 'player_not_found' })
}

export function requireHost(
	state: RoomState,
	actorPlayerId: PlayerId,
): Result<GamePlayerState, CommandError> {
	const actorResult = requirePlayer(state, actorPlayerId)
	if (!actorResult.ok) {
		return actorResult
	}

	const actor = actorResult.value

	if (actor.id !== state.hostPlayerId) {
		return err({
			code: 'only_host_can_start',
		})
	}

	return ok(actor)
}
