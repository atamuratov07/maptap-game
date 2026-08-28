import type { SessionIdentity } from '@georally/game-protocol'

export interface RoomSession extends SessionIdentity {
	savedAt: number
}
