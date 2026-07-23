import type {
	GameCompletedState,
	GameOpenState,
	GameResult,
	GameState,
} from '../game/types'

export type MemberId = string

export type RoomId = string
export type RoomCode = string
export type RoomMemberRole = 'host' | 'player'

export const ROOM_PHASES = ['lobby', 'active', 'finished'] as const
export type RoomPhase = (typeof ROOM_PHASES)[number]

export interface RoomMemberState {
	id: MemberId
	name: string
	role: RoomMemberRole
	connected: boolean
	joinedAt: number
	lastConnectedAt: number
	lastDisconnectedAt: number | null
}

export interface RoomStateBase {
	roomId: RoomId
	roomCode: RoomCode
	hostId: MemberId
	membersById: Record<MemberId, RoomMemberState>
	memberOrder: MemberId[]
	createdAt: number
	gameHistory: GameResult[]
}

export interface RoomLobbyState extends RoomStateBase {
	phase: 'lobby'
}

export interface RoomActiveState extends RoomStateBase {
	phase: 'active'
	activeGame: GameState
}

export interface RoomActiveCompletedState extends RoomStateBase {
	phase: 'active'
	activeGame: GameCompletedState
}

export interface RoomFinishedState extends RoomStateBase {
	phase: 'finished'
	lastGameResult: GameResult
	finishedAt: number
}

export type RoomState = RoomLobbyState | RoomActiveState | RoomFinishedState

export function getRoomStateBase(state: RoomState): RoomStateBase {
	return {
		roomId: state.roomId,
		roomCode: state.roomCode,
		hostId: state.hostId,
		membersById: state.membersById,
		memberOrder: state.memberOrder,
		createdAt: state.createdAt,
		gameHistory: state.gameHistory,
	}
}

export function toRoomLobbyState(state: RoomState): RoomLobbyState {
	return {
		...getRoomStateBase(state),
		phase: 'lobby',
	}
}

export function toRoomActiveState(
	state: RoomState,
	activeGame: GameOpenState,
): RoomActiveState {
	return {
		...getRoomStateBase(state),
		phase: 'active',
		activeGame,
	}
}

export function toRoomFinishedState(
	state: RoomActiveCompletedState,
	finishedAt: number,
): RoomFinishedState {
	const lastGameResult = state.activeGame.result
	return {
		...getRoomStateBase(state),
		phase: 'finished',
		lastGameResult,
		finishedAt,
		gameHistory: [...state.gameHistory, lastGameResult],
	}
}
