import type {
	PlayerId,
	PlayerRole,
	RoomId,
} from '@maptap/game-domain/multiplayer'
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
} from '@maptap/game-protocol'
import type { Namespace, Socket } from 'socket.io'

export type PlayerSessionToken = string

export interface GameSocketData {
	role?: PlayerRole
	roomId?: RoomId
	playerId?: PlayerId
	playerSessionToken?: PlayerSessionToken
}

export type GameNamespace = Namespace<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	GameSocketData
>

export type GameSocket = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	GameSocketData
>

export interface BoundServiceResponse<T> {
	response: T
	replacedSocketId?: string
}
