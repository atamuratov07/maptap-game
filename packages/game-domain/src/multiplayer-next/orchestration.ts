import { err, ok, type Result } from '../shared/result'
import type { CommandError, SessionPreparationError } from './errors'
import {
	advanceGame,
	applyGameCommand,
	createGame,
	type GameCommand,
	type GameSession,
} from './game'
import {
	applyRoomCommand,
	applyRoomTransition,
	type MemberId,
	type RoomState,
} from './room'

export type StartRoomGameInput = {
	room: RoomState
	actorId: MemberId
	gameId: string
	session: GameSession
	now: number
}

export function startRoomGame(
	input: StartRoomGameInput,
): Result<RoomState, CommandError | SessionPreparationError> {
	if (input.room.phase !== 'lobby') {
		return err({
			code: 'room_not_in_lobby',
		})
	}

	const gameResult = createGame({
		gameId: input.gameId,
		session: input.session,
		participantIds: input.room.memberOrder,
		now: input.now,
	})

	if (!gameResult.ok) {
		return gameResult
	}

	return applyRoomCommand(input.room, {
		type: 'START_GAME',
		actorId: input.actorId,
		activeGame: gameResult.value,
	})
}

export function submitRoomGameAnswer(
	room: RoomState,
	command: GameCommand,
): Result<RoomState, CommandError> {
	if (room.phase !== 'active') {
		return err({
			code: 'room_not_active',
		})
	}

	const gameResult = applyGameCommand(room.activeGame, command)
	if (!gameResult.ok) {
		return gameResult
	}

	return ok({
		...room,
		activeGame: gameResult.value,
	})
}

export function advanceActiveRoomGame(
	room: RoomState,
	now: number,
): Result<RoomState, CommandError> {
	if (room.phase !== 'active') {
		return err({
			code: 'room_not_active',
		})
	}

	const gameResult = advanceGame(room.activeGame, { now })
	if (!gameResult.ok) {
		return gameResult
	}

	const activeRoom: RoomState = {
		...room,
		activeGame: gameResult.value,
	}

	if (gameResult.value.phase !== 'completed') {
		return ok(activeRoom)
	}

	return applyRoomTransition(activeRoom, {
		type: 'FINISH_ACTIVE_GAME',
		now,
	})
}
