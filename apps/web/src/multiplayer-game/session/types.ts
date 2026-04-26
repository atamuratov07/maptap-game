import type { SessionIdentity } from '@maptap/game-protocol'

export interface RoomSession extends SessionIdentity {
	savedAt: number
}
