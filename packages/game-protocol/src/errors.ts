import type {
	CommandError,
	SessionPreparationError,
} from '@georally/game-domain/multiplayer'

export type TransportError =
	| { code: 'invalid_payload' }
	| { code: 'room_not_found' }
	| { code: 'member_session_not_found' }
	| { code: 'unauthorized' }
	| { code: 'room_closed' }
	| { code: 'internal_error' }

export type RoomProtocolError =
	TransportError | CommandError | SessionPreparationError
