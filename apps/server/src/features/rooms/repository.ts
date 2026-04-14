import type {
	PlayerId,
	PlayerRole,
	RoomCode,
	RoomId,
	RoomState,
	RoomTransition,
} from '@maptap/game-domain/multiplayer'

import type { PlayerSessionToken } from './types.js'

export type RoomTransitionAction = RoomTransition['type']
export interface ScheduledRoomTransition {
	action: RoomTransitionAction
	dueAt: number
	handle: NodeJS.Timeout
}

export interface PlayerSessionRecord {
	token: PlayerSessionToken
	roomId: RoomId
	playerId: PlayerId
	role: PlayerRole
	socketId: string | null
}

export interface RoomContext {
	state: RoomState
	playerSessionTokensByPlayerId: Map<PlayerId, PlayerSessionToken>
	scheduledTransition: ScheduledRoomTransition | null
}

export class RoomsRepository {
	private readonly roomsById = new Map<RoomId, RoomContext>()
	private readonly roomIdByCode = new Map<RoomCode, RoomId>()
	private readonly sessionsByToken = new Map<
		PlayerSessionToken,
		PlayerSessionRecord
	>()
	private readonly sessionTokenBySocketId = new Map<
		string,
		PlayerSessionToken
	>()

	hasRoomCode(roomCode: RoomCode): boolean {
		return this.roomIdByCode.has(roomCode)
	}

	createRoom(state: RoomState): RoomContext {
		if (
			this.roomsById.has(state.roomId) ||
			this.roomIdByCode.has(state.roomCode)
		) {
			throw new Error(`Room ${state.roomId} already exists.`)
		}

		const context: RoomContext = {
			state,
			playerSessionTokensByPlayerId: new Map(),
			scheduledTransition: null,
		}

		this.roomsById.set(state.roomId, context)
		this.roomIdByCode.set(state.roomCode, state.roomId)

		return context
	}

	getRoomById(roomId: RoomId): RoomContext | undefined {
		return this.roomsById.get(roomId)
	}

	getRoomByCode(roomCode: RoomCode): RoomContext | undefined {
		const roomId = this.roomIdByCode.get(roomCode)
		return roomId ? this.roomsById.get(roomId) : undefined
	}

	listRooms(): RoomContext[] {
		return [...this.roomsById.values()]
	}

	getRoomCount(): number {
		return this.roomsById.size
	}

	setRoomState(roomId: RoomId, newState: RoomState): RoomContext | undefined {
		const context = this.roomsById.get(roomId)
		if (!context) {
			return undefined
		}

		if (context.state.roomCode !== newState.roomCode) {
			this.roomIdByCode.delete(context.state.roomCode)
			this.roomIdByCode.set(newState.roomCode, roomId)
		}

		context.state = newState
		return context
	}

	setScheduledTransition(
		roomId: RoomId,
		scheduledTransition: ScheduledRoomTransition | null,
	): void {
		const context = this.roomsById.get(roomId)
		if (!context) {
			return
		}

		if (context.scheduledTransition) {
			clearTimeout(context.scheduledTransition.handle)
		}

		context.scheduledTransition = scheduledTransition
	}

	createPlayerSession(session: PlayerSessionRecord): PlayerSessionRecord {
		if (this.sessionsByToken.has(session.token)) {
			throw new Error(`Player session ${session.token} already exists.`)
		}

		this.sessionsByToken.set(session.token, session)
		const context = this.roomsById.get(session.roomId)
		context?.playerSessionTokensByPlayerId.set(
			session.playerId,
			session.token,
		)

		if (session.socketId) {
			this.sessionTokenBySocketId.set(session.socketId, session.token)
		}

		return session
	}

	getPlayerSession(
		playerSessionToken: PlayerSessionToken,
	): PlayerSessionRecord | undefined {
		return this.sessionsByToken.get(playerSessionToken)
	}

	getPlayerSessionBySocketId(
		socketId: string,
	): PlayerSessionRecord | undefined {
		const playerSessionToken = this.sessionTokenBySocketId.get(socketId)
		return playerSessionToken
			? this.sessionsByToken.get(playerSessionToken)
			: undefined
	}

	bindSocketToSession(
		playerSessionToken: PlayerSessionToken,
		socketId: string,
	): string | undefined {
		const session = this.sessionsByToken.get(playerSessionToken)
		if (!session) {
			return undefined
		}

		const previousToken = this.sessionTokenBySocketId.get(socketId)
		if (previousToken && previousToken !== playerSessionToken) {
			const previousSession = this.sessionsByToken.get(previousToken)
			if (previousSession && previousSession.socketId === socketId) {
				previousSession.socketId = null
			}

			this.sessionTokenBySocketId.delete(socketId)
		}

		const previousSocketId =
			session.socketId && session.socketId !== socketId
				? session.socketId
				: undefined

		if (previousSocketId) {
			this.sessionTokenBySocketId.delete(previousSocketId)
		}

		session.socketId = socketId
		this.sessionTokenBySocketId.set(socketId, playerSessionToken)

		return previousSocketId
	}

	unbindSocket(socketId: string): PlayerSessionRecord | undefined {
		const playerSessionToken = this.sessionTokenBySocketId.get(socketId)
		if (!playerSessionToken) {
			return undefined
		}

		this.sessionTokenBySocketId.delete(socketId)

		const session = this.sessionsByToken.get(playerSessionToken)
		if (session && session.socketId === socketId) {
			session.socketId = null
		}

		return session
	}

	listPlayerSessions(roomId: RoomId): PlayerSessionRecord[] {
		const context = this.roomsById.get(roomId)
		if (!context) {
			return []
		}

		return [...context.playerSessionTokensByPlayerId.values()].flatMap(
			token => {
				const session = this.sessionsByToken.get(token)
				return session ? [session] : []
			},
		)
	}

	getConnectedSessionCount(): number {
		let connectedSessionCount = 0

		console.log(Array.from(this.sessionsByToken.values()))
		for (const session of this.sessionsByToken.values()) {
			if (session.socketId) {
				connectedSessionCount += 1
			}
		}

		return connectedSessionCount
	}

	clearAllScheduledTransitions(): void {
		for (const context of this.roomsById.values()) {
			if (context.scheduledTransition) {
				clearTimeout(context.scheduledTransition.handle)
				context.scheduledTransition = null
			}
		}
	}
}
