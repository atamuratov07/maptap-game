import type { CommandError, SessionPreparationError } from '@maptap/game-domain'

export type TransportError =
	| { code: 'invalid_payload' }
	| { code: 'room_not_found' }
	| { code: 'player_session_not_found' }
	| { code: 'unauthorized' }
	| { code: 'room_closed' }
	| { code: 'internal_error' }

export type GameProtocolError =
	| TransportError
	| CommandError
	| SessionPreparationError
