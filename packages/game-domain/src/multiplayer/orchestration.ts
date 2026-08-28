import type { CountryPool } from '../catalog/types'
import { err, ok, type Result } from '../shared/result'
import type { CountryId } from '../shared/types'
import type { CommandError, DomainError } from './errors'
import {
	advanceGame,
	advanceGameRound,
	applyGameCommand,
	createGame,
	getNextGameAdvanceAt,
	prepareGameSession,
	type GameAdvanceScheduleConfig,
	type GameConfig,
} from './game'
import {
	applyRoomCommand,
	applyRoomTransition,
	isRoomInClassroomMode,
	isRoomInGroupMode,
	requireHost,
	type MemberId,
	type RoomState,
} from './room'

export type StartRoomGameInput = {
	room: RoomState
	actorId: MemberId
	gameId: string
	countryPool: CountryPool
	config: GameConfig
	now: number
}

export type SubmitRoomGameAnswerInput = {
	room: RoomState
	memberId: MemberId
	countryId: CountryId
	now: number
}

export function startRoomGame(
	input: StartRoomGameInput,
): Result<RoomState, DomainError> {
	if (input.room.phase !== 'lobby') {
		return err({
			code: 'room_not_in_lobby',
		})
	}

	const hostResult = requireHost(input.room, input.actorId)
	if (!hostResult.ok) {
		return hostResult
	}

	if (isRoomInGroupMode(input.room) && !input.config.questionDurationMs) {
		return err({
			code: 'invalid_game_config',
		})
	}

	const gameSession = prepareGameSession(input.countryPool, input.config)
	if (!gameSession.ok) {
		return gameSession
	}

	const participantIds = input.room.memberOrder.filter(memberId => {
		const member = input.room.membersById[memberId]

		if (!member.connected) return false
		if (isRoomInClassroomMode(input.room) && member.role === 'host')
			return false

		return true
	})

	const gameResult = createGame({
		gameId: input.gameId,
		session: gameSession.value,
		participantIds,
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
	input: SubmitRoomGameAnswerInput,
): Result<RoomState, CommandError> {
	if (input.room.phase !== 'active') {
		return err({
			code: 'room_not_active',
		})
	}

	const gameResult = applyGameCommand(input.room.activeGame, {
		type: 'SUBMIT_ANSWER',
		participantId: input.memberId,
		countryId: input.countryId,
		now: input.now,
	})
	if (!gameResult.ok) {
		return gameResult
	}

	return ok({
		...input.room,
		activeGame: gameResult.value,
	})
}

export function revealActiveRoomGameRound(
	room: RoomState,
	actorId: MemberId,
	now: number,
): Result<RoomState, CommandError> {
	if (room.phase !== 'active') {
		return err({
			code: 'room_not_active',
		})
	}

	if (!isRoomInClassroomMode(room)) {
		return err({
			code: 'room_not_in_classroom_mode',
		})
	}

	const hostResult = requireHost(room, actorId)
	if (!hostResult.ok) {
		return hostResult
	}
	const gameResult = applyGameCommand(room.activeGame, {
		type: 'REVEAL_ROUND',
		now,
	})

	if (!gameResult.ok) {
		return gameResult
	}

	return ok({
		...room,
		activeGame: gameResult.value,
	})
}

export function advanceActiveRoomGameRound(
	room: RoomState,
	now: number,
	actorId: MemberId,
): Result<RoomState, CommandError> {
	if (room.phase !== 'active') {
		return err({
			code: 'room_not_active',
		})
	}

	if (!isRoomInClassroomMode(room)) {
		return err({
			code: 'room_not_in_classroom_mode',
		})
	}

	const hostResult = requireHost(room, actorId)
	if (!hostResult.ok) {
		return hostResult
	}

	const gameResult = advanceGameRound(room.activeGame, {
		advanceablePhase: 'revealed',
		now,
	})

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

export function getNextActiveRoomGameAdvanceAt(
	room: RoomState,
	config: Required<GameAdvanceScheduleConfig>,
): number | null {
	if (room.phase !== 'active') {
		return null
	}

	return getNextGameAdvanceAt(
		room.activeGame,
		isRoomInGroupMode(room) ? config : {},
	)
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

	const gameResult = advanceGame(room.activeGame, {
		advanceablePhase: 'leaderboard',
		now,
	})

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
