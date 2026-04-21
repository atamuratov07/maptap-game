import type {
	MemberId,
	RoomId,
	RoomMemberRole,
} from '@maptap/game-domain/multiplayer-next/room'
import type {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
} from '@maptap/game-protocol'
import type { Namespace, Socket } from 'socket.io'

export type MemberSessionToken = string

export interface GameSocketData {
	role?: RoomMemberRole
	roomId?: RoomId
	memberId?: MemberId
	memberSessionToken?: MemberSessionToken
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
