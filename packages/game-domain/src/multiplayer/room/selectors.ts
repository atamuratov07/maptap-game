import type { GameResult, GameState } from '../game/types'
import type {
	MemberId,
	RoomMemberState,
	RoomState,
} from './types'

export function getMember(
	state: RoomState,
	memberId: MemberId,
): RoomMemberState | undefined {
	return state.membersById[memberId]
}

export function getMembers(state: RoomState): RoomMemberState[] {
	return state.memberOrder.flatMap(memberId => {
		const member = state.membersById[memberId]
		return member ? [member] : []
	})
}

export function getHostMember(
	state: RoomState,
): RoomMemberState | undefined {
	return getMember(state, state.hostId)
}

export function isHostMember(state: RoomState, memberId: MemberId): boolean {
	return state.hostId === memberId
}

export function getConnectedMemberCount(state: RoomState): number {
	return getMembers(state).filter(member => member.connected).length
}

export function isRoomJoinable(state: RoomState): boolean {
	return state.phase === 'lobby'
}

export function getActiveGame(state: RoomState): GameState | undefined {
	return state.phase === 'active' ? state.activeGame : undefined
}

export function getLastGameResult(state: RoomState): GameResult | undefined {
	return state.phase === 'finished' ? state.lastGameResult : undefined
}

export function getGameHistory(state: RoomState): readonly GameResult[] {
	return state.gameHistory
}
