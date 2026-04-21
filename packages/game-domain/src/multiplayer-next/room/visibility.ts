import type { GameResult } from '../game/types'
import {
	toHostGameView,
	toPlayerGameView,
	type HostGameView,
	type PlayerGameView,
} from '../game/visibility'
import { getConnectedMemberCount, getMember, getMembers } from './selectors'
import type { MemberId, RoomMemberRole, RoomPhase, RoomState } from './types'

export interface VisibleMemberInfo {
	memberId: MemberId
	name: string
	role: RoomMemberRole
	connected: boolean
	isHost: boolean
}

interface RoomViewBase {
	roomId: string
	roomCode: string
	phase: RoomPhase
	hostId: MemberId
	viewerMemberId: MemberId
	viewerRole: RoomMemberRole
	createdAt: number
	members: VisibleMemberInfo[]
	connectedMemberCount: number
	gameHistoryCount: number
}

interface RoomHostViewBase extends RoomViewBase {
	viewerRole: 'host'
}

interface RoomPlayerViewBase extends RoomViewBase {
	viewerRole: 'player'
}

export interface RoomHostLobbyView extends RoomHostViewBase {
	phase: 'lobby'
	activeGame: null
	lastGameResult: null
}

export interface RoomHostActiveView extends RoomHostViewBase {
	phase: 'active'
	activeGame: HostGameView
	lastGameResult: null
}

export interface RoomHostFinishedView extends RoomHostViewBase {
	phase: 'finished'
	activeGame: null
	finishedAt: number
	lastGameResult: GameResult
}

export type RoomHostView =
	| RoomHostLobbyView
	| RoomHostActiveView
	| RoomHostFinishedView

export interface RoomPlayerLobbyView extends RoomPlayerViewBase {
	phase: 'lobby'
	activeGame: null
	lastGameResult: null
}

export interface RoomPlayerActiveView extends RoomPlayerViewBase {
	phase: 'active'
	activeGame: PlayerGameView
	lastGameResult: null
}

export interface RoomPlayerFinishedView extends RoomPlayerViewBase {
	phase: 'finished'
	activeGame: null
	finishedAt: number
	lastGameResult: GameResult
}

export type RoomPlayerView =
	| RoomPlayerLobbyView
	| RoomPlayerActiveView
	| RoomPlayerFinishedView

export type RoomLobbyView = RoomHostLobbyView | RoomPlayerLobbyView
export type RoomActiveView = RoomHostActiveView | RoomPlayerActiveView
export type RoomFinishedView = RoomHostFinishedView | RoomPlayerFinishedView
export type RoomView = RoomHostView | RoomPlayerView

function toVisibleMembers(state: RoomState): VisibleMemberInfo[] {
	return getMembers(state).map(member => ({
		memberId: member.id,
		name: member.name,
		role: member.role,
		connected: member.connected,
		isHost: member.id === state.hostId,
	}))
}

function getRoomViewBase(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomViewBase | undefined {
	const viewer = getMember(state, viewerMemberId)
	if (!viewer) {
		return undefined
	}

	return {
		roomId: state.roomId,
		roomCode: state.roomCode,
		phase: state.phase,
		hostId: state.hostId,
		viewerMemberId,
		viewerRole: viewer.role,
		createdAt: state.createdAt,
		members: toVisibleMembers(state),
		connectedMemberCount: getConnectedMemberCount(state),
		gameHistoryCount: state.gameHistory.length,
	}
}

function getHostRoomViewBase(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomHostViewBase | undefined {
	const base = getRoomViewBase(state, viewerMemberId)
	return base?.viewerRole === 'host'
		? {
				...base,
				viewerRole: 'host',
			}
		: undefined
}

function getPlayerRoomViewBase(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomPlayerViewBase | undefined {
	const base = getRoomViewBase(state, viewerMemberId)
	return base?.viewerRole === 'player'
		? {
				...base,
				viewerRole: 'player',
			}
		: undefined
}

export function toHostRoomView(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomHostView | undefined {
	const base = getHostRoomViewBase(state, viewerMemberId)
	if (!base) {
		return undefined
	}

	switch (state.phase) {
		case 'lobby':
			return {
				...base,
				phase: 'lobby',
				activeGame: null,
				lastGameResult: null,
			}

		case 'active':
			return {
				...base,
				phase: 'active',
				activeGame: toHostGameView(state.activeGame, viewerMemberId),
				lastGameResult: null,
			}

		case 'finished':
			return {
				...base,
				phase: 'finished',
				activeGame: null,
				finishedAt: state.finishedAt,
				lastGameResult: state.lastGameResult,
			}
	}
}

export function toPlayerRoomView(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomPlayerView | undefined {
	const base = getPlayerRoomViewBase(state, viewerMemberId)
	if (!base) {
		return undefined
	}

	switch (state.phase) {
		case 'lobby':
			return {
				...base,
				phase: 'lobby',
				activeGame: null,
				lastGameResult: null,
			}

		case 'active':
			return {
				...base,
				phase: 'active',
				activeGame: toPlayerGameView(state.activeGame, viewerMemberId),
				lastGameResult: null,
			}

		case 'finished':
			return {
				...base,
				phase: 'finished',
				activeGame: null,
				finishedAt: state.finishedAt,
				lastGameResult: state.lastGameResult,
			}
	}
}

export function toRoomView(
	state: RoomState,
	viewerMemberId: MemberId,
): RoomView | undefined {
	const viewer = getMember(state, viewerMemberId)
	if (!viewer) {
		return undefined
	}

	return viewer.role === 'host'
		? toHostRoomView(state, viewerMemberId)
		: toPlayerRoomView(state, viewerMemberId)
}
