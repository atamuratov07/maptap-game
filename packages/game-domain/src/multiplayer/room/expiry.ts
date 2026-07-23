import { getConnectedMemberCount, getHostMember, getMembers } from './selectors'
import type { RoomState } from './types'

export interface RoomExpireTTLConfig {
	noConnectedMembersMs: number
	finishedMs: number
	hostDisconnectedMs: number
}

export function getRoomExpireDueAt(
	state: RoomState,
	config: RoomExpireTTLConfig,
): number | null {
	if (getConnectedMemberCount(state) === 0) {
		const emptiedAt = Math.max(
			0,
			...getMembers(state).map(member => member.lastDisconnectedAt ?? 0),
		)
		return emptiedAt + config.noConnectedMembersMs
	}

	if (state.phase === 'finished') {
		return state.finishedAt + config.finishedMs
	}

	const host = getHostMember(state)
	if (host && !host.connected) {
		if (state.phase !== 'active') {
			return (host.lastDisconnectedAt ?? 0) + config.hostDisconnectedMs
		}
	}

	return null
}
