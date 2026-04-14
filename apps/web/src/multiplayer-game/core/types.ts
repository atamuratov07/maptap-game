import type {
	RoomHostView,
	RoomPlayerView,
} from '@maptap/game-domain/multiplayer'
import type {
	GameProtocolError,
	LookupRoomFoundResponse,
	RoomClosedEvent,
	SessionIdentity,
} from '@maptap/game-protocol'

export interface RoomSession extends SessionIdentity {
	savedAt: number
}

export type GatewayError =
	| GameProtocolError
	| {
			code: 'transport_error'
			message: string
	  }

export type RoomHostSessionState =
	| {
			status: 'connecting'
			roomCode: string
	  }
	| {
			status: 'ready'
			roomCode: string
			identity: RoomSession
			room: RoomHostView
	  }
	| {
			status: 'reconnecting'
			roomCode: string
			identity: RoomSession
			room: RoomHostView | null
	  }
	| {
			status: 'closed'
			roomCode: string
			identity: RoomSession | null
			room: RoomHostView | null
			reason: RoomClosedEvent['reason']
	  }
	| {
			status: 'error'
			roomCode: string
			message: string
	  }

export type RoomPlayerSessionState =
	| {
			status: 'idle'
			roomCode: string
			roomInfo: LookupRoomFoundResponse
			resumeMessage: string | null
	  }
	| {
			status: 'connecting'
			roomCode: string
			step: 'lookup' | 'resume'
	  }
	| {
			status: 'ready'
			roomCode: string
			identity: RoomSession
			room: RoomPlayerView
	  }
	| {
			status: 'reconnecting'
			roomCode: string
			identity: RoomSession
			room: RoomPlayerView | null
	  }
	| {
			status: 'closed'
			roomCode: string
			identity: RoomSession | null
			room: RoomPlayerView | null
			reason: RoomClosedEvent['reason']
	  }
	| {
			status: 'error'
			roomCode: string
			message: string
	  }
