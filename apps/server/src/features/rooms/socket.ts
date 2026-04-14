import type { AckCallback, GameProtocolError } from '@maptap/game-protocol'
import {
	createRoomRequestSchema,
	joinRoomRequestSchema,
	lookupRoomRequestSchema,
	resumeHostRoomRequestSchema,
	resumePlayerRoomRequestSchema,
	startGameRequestSchema,
	submitAnswerRequestSchema,
} from '@maptap/game-protocol'
import type { ZodType } from 'zod'

import type { PlayerRole } from '@maptap/game-domain/multiplayer'
import type { RoomsService } from './service.js'
import type { GameNamespace, GameSocket } from './types.js'

export interface RegisterRoomHandlersOptions {
	namespace: GameNamespace
	roomsService: RoomsService
}

function respondWithError<T>(
	ack: AckCallback<T>,
	error: GameProtocolError,
): void {
	ack({
		ok: false,
		error,
	})
}

function respondWithSuccess<T>(ack: AckCallback<T>, data: T): void {
	ack({
		ok: true,
		data,
	})
}

function parsePayload<T>(
	schema: ZodType<T>,
	payload: unknown,
): { ok: true; value: T } | { ok: false } {
	const parsed = schema.safeParse(payload)
	if (!parsed.success) {
		return {
			ok: false,
		}
	}

	return {
		ok: true,
		value: parsed.data,
	}
}

function requireAuthenticated(
	socket: GameSocket,
): { ok: true; value: string } | { ok: false } {
	return socket.data.playerSessionToken
		? {
				ok: true,
				value: socket.data.playerSessionToken,
			}
		: {
				ok: false,
			}
}

function bindSocketIdentity(
	socket: GameSocket,
	identity: {
		role: PlayerRole
		roomId: string
		playerId: string
		playerSessionToken: string
	},
): void {
	socket.data.roomId = identity.roomId
	socket.data.role = identity.role
	socket.data.playerId = identity.playerId
	socket.data.playerSessionToken = identity.playerSessionToken
}

function clearSocketIdentity(socket: GameSocket): void {
	socket.data.roomId = undefined
	socket.data.playerId = undefined
	socket.data.playerSessionToken = undefined
}

function disconnectReplacedSocket(
	namespace: GameNamespace,
	socketId: string | undefined,
	currentSocketId: string,
): void {
	if (!socketId || socketId === currentSocketId) {
		return
	}

	namespace.sockets.get(socketId)?.disconnect(true)
}

export function registerRoomHandlers({
	namespace,
	roomsService,
}: RegisterRoomHandlersOptions): void {
	namespace.on('connection', socket => {
		socket.on('room:lookup', (payload, ack) => {
			const parsed = parsePayload(lookupRoomRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			return respondWithSuccess(
				ack,
				roomsService.lookupRoom(parsed.value.roomCode),
			)
		})

		socket.on('room:create', (payload, ack) => {
			const auth = requireAuthenticated(socket)
			if (auth.ok) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(createRoomRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const createdRoom = roomsService.createRoom({
				hostName: parsed.value.hostName,
				gameConfig: parsed.value.gameConfig,
				socketId: socket.id,
			})
			if (!createdRoom.ok) {
				return respondWithError(ack, createdRoom.error)
			}

			bindSocketIdentity(socket, createdRoom.value.response)

			return respondWithSuccess(ack, createdRoom.value.response)
		})

		socket.on('room:join', (payload, ack) => {
			const auth = requireAuthenticated(socket)
			if (auth.ok) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(joinRoomRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const joinedRoom = roomsService.joinRoom({
				roomCode: parsed.value.roomCode,
				playerName: parsed.value.playerName,
				socketId: socket.id,
			})

			if (!joinedRoom.ok) {
				return respondWithError(ack, joinedRoom.error)
			}

			bindSocketIdentity(socket, joinedRoom.value.response)

			return respondWithSuccess(ack, joinedRoom.value.response)
		})

		socket.on('room:host-resume', (payload, ack) => {
			if (!payload.playerSessionToken) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(resumeHostRoomRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const resumedRoom = roomsService.resumeHostRoom({
				playerSessionToken: parsed.value.playerSessionToken,
				socketId: socket.id,
			})

			if (!resumedRoom.ok) {
				return respondWithError(ack, resumedRoom.error)
			}

			bindSocketIdentity(socket, {
				role: 'host',
				roomId: resumedRoom.value.response.roomId,
				playerId: resumedRoom.value.response.playerId,
				playerSessionToken: parsed.value.playerSessionToken,
			})
			disconnectReplacedSocket(
				namespace,
				resumedRoom.value.replacedSocketId,
				socket.id,
			)

			return respondWithSuccess(ack, resumedRoom.value.response)
		})

		socket.on('room:player-resume', (payload, ack) => {
			if (!payload.playerSessionToken) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(resumePlayerRoomRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const resumedRoom = roomsService.resumePlayerRoom({
				playerSessionToken: parsed.value.playerSessionToken,
				socketId: socket.id,
			})

			if (!resumedRoom.ok) {
				return respondWithError(ack, resumedRoom.error)
			}

			bindSocketIdentity(socket, {
				role: 'player',
				roomId: resumedRoom.value.response.roomId,
				playerId: resumedRoom.value.response.playerId,
				playerSessionToken: parsed.value.playerSessionToken,
			})
			disconnectReplacedSocket(
				namespace,
				resumedRoom.value.replacedSocketId,
				socket.id,
			)

			return respondWithSuccess(ack, resumedRoom.value.response)
		})

		socket.on('game:start', (payload, ack) => {
			const auth = requireAuthenticated(socket)
			if (!auth.ok) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(startGameRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const startedGame = roomsService.startGame({
				playerSessionToken: auth.value,
			})

			if (!startedGame.ok) {
				return respondWithError(ack, startedGame.error)
			}

			return respondWithSuccess(ack, startedGame.value)
		})

		socket.on('game:submit-answer', (payload, ack) => {
			const auth = requireAuthenticated(socket)
			if (!auth.ok) {
				return respondWithError(ack, {
					code: 'unauthorized',
				})
			}

			const parsed = parsePayload(submitAnswerRequestSchema, payload)
			if (!parsed.ok) {
				return respondWithError(ack, {
					code: 'invalid_payload',
				})
			}

			const submittedAnswer = roomsService.submitAnswer({
				playerSessionToken: auth.value,
				countryId: parsed.value.countryId,
			})

			if (!submittedAnswer.ok) {
				return respondWithError(ack, submittedAnswer.error)
			}

			return respondWithSuccess(ack, submittedAnswer.value)
		})

		socket.on('disconnect', () => {
			roomsService.disconnectSocket(socket.id)
			clearSocketIdentity(socket)
		})
	})
}
