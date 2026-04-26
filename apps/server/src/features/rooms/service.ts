import { err, ok, type CountryPool, type Result } from '@maptap/game-domain'
import type {
	CreateRoomResponse,
	EmptyAckData,
	GameProtocolError,
	JoinRoomResponse,
	LookupRoomResponse,
	ResumeHostRoomResponse,
	ResumePlayerRoomResponse,
	RoomClosedEvent,
	SubmitAnswerResponse,
} from '@maptap/game-protocol'

import {
	advanceActiveRoomGame,
	getNextActiveRoomGameAdvanceAt,
	startRoomGame,
	submitRoomGameAnswer,
} from '@maptap/game-domain/multiplayer-next'
import {
	getAnsweredParticipantCount,
	prepareGameSession,
	type GameConfig,
} from '@maptap/game-domain/multiplayer-next/game'
import {
	applyRoomCommand,
	createRoom,
	toHostRoomView,
	toPlayerRoomView,
	type MemberId,
	type RoomHostView,
	type RoomId,
	type RoomPlayerView,
	type RoomState,
} from '@maptap/game-domain/multiplayer-next/room'
import {
	createGameId,
	createMemberId,
	createMemberSessionToken,
	createRoomCode,
	createRoomId,
} from './ids.js'
import type { MemberSessionRecord, RoomsRepository } from './repository.js'
import type { BoundServiceResponse, MemberSessionToken } from './types.js'

type ServiceResult<T> = Result<T, GameProtocolError>

interface RoomUpdateOptions {
	excludeMemberId?: MemberId
}

interface GameRoomServiceHooks {
	onRoomUpdated: (roomId: RoomId, options?: RoomUpdateOptions) => void
	onRoomClosed: (roomId: RoomId, reason: RoomClosedEvent['reason']) => void
}

export interface RoomsServiceOptions {
	countryPool: CountryPool
	repository: RoomsRepository
	revealDurationMs: number
	leaderboardDurationMs: number
	hooks: GameRoomServiceHooks
	now?: () => number
}

export interface CreateRoomInput {
	hostName: string
	socketId: string
}

export interface JoinRoomInput {
	roomCode: string
	memberName: string
	socketId: string
}

export interface ResumeHostRoomInput {
	memberSessionToken: MemberSessionToken
	socketId: string
}
export interface ResumePlayerRoomInput {
	memberSessionToken: MemberSessionToken
	socketId: string
}

export interface StartGameInput {
	memberSessionToken: MemberSessionToken
	gameConfig: GameConfig
}

export interface SubmitAnswerInput {
	memberSessionToken: MemberSessionToken
	countryId: string
}

export interface ReturnToLobbyInput {
	memberSessionToken: MemberSessionToken
}

export interface TerminateRoomInput {
	memberSessionToken: MemberSessionToken
}

export class RoomsService {
	private readonly countryPool: CountryPool
	private readonly repository: RoomsRepository
	private readonly revealDurationMs: number
	private readonly leaderboardDurationMs: number
	private readonly hooks: GameRoomServiceHooks
	private readonly now: () => number

	constructor(options: RoomsServiceOptions) {
		this.countryPool = options.countryPool
		this.repository = options.repository
		this.revealDurationMs = options.revealDurationMs
		this.leaderboardDurationMs = options.leaderboardDurationMs
		this.hooks = options.hooks
		this.now = options.now ?? Date.now
	}

	getHealthSnapshot() {
		return {
			roomCount: this.repository.getRoomCount(),
			connectedSessionCount: this.repository.getConnectedSessionCount(),
		}
	}

	lookupRoom(roomCode: string): LookupRoomResponse {
		const context = this.repository.getRoomByCode(roomCode)
		if (!context) {
			return {
				exists: false,
				roomCode,
			}
		}

		const host = context.state.membersById[context.state.hostId]

		return {
			exists: true,
			roomCode: context.state.roomCode,
			phase: context.state.phase,
			joinable: context.state.phase === 'lobby',
			memberCount: context.state.memberOrder.length,
			hostName: host?.name ?? 'Host',
		}
	}

	createRoom(
		input: CreateRoomInput,
	): ServiceResult<BoundServiceResponse<CreateRoomResponse>> {
		const roomId = createRoomId()
		const roomCode = createRoomCode(
			code => !this.repository.hasRoomCode(code),
		)
		const hostId = createMemberId()
		const roomResult = createRoom({
			roomId,
			roomCode,
			hostId,
			hostName: input.hostName,
			now: this.now(),
		})

		if (!roomResult.ok) {
			return roomResult
		}

		this.repository.createRoom(roomResult.value)

		const hostSessionToken = createMemberSessionToken()
		this.repository.createMemberSession({
			role: 'host',
			token: hostSessionToken,
			roomId,
			memberId: hostId,
			socketId: input.socketId,
		})

		const snapshot = this.buildRoomHostSnapshot(roomResult.value, hostId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				role: 'host',
				roomId,
				roomCode,
				memberId: hostId,
				memberSessionToken: hostSessionToken,
				snapshot: snapshot.value,
			},
		})
	}

	joinRoom(
		input: JoinRoomInput,
	): ServiceResult<BoundServiceResponse<JoinRoomResponse>> {
		const context = this.repository.getRoomByCode(input.roomCode)
		if (!context) {
			return err({
				code: 'room_not_found',
			})
		}

		const memberId = createMemberId()
		const nextState = applyRoomCommand(context.state, {
			type: 'JOIN_MEMBER',
			id: memberId,
			name: input.memberName,
			now: this.now(),
		})

		if (!nextState.ok) {
			return nextState
		}

		this.commitRoomState(context.state.roomId, nextState.value, {
			excludeMemberId: memberId,
		})

		const memberSessionToken = createMemberSessionToken()
		this.repository.createMemberSession({
			role: 'player',
			token: memberSessionToken,
			roomId: nextState.value.roomId,
			memberId,
			socketId: input.socketId,
		})

		const snapshot = this.buildRoomPlayerSnapshot(nextState.value, memberId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				role: 'player',
				roomId: nextState.value.roomId,
				roomCode: nextState.value.roomCode,
				memberId,
				memberSessionToken,
				snapshot: snapshot.value,
			},
		})
	}

	resumeHostRoom(
		input: ResumeHostRoomInput,
	): ServiceResult<BoundServiceResponse<ResumeHostRoomResponse>> {
		const session = this.repository.getMemberSession(input.memberSessionToken)
		if (!session) {
			return err({
				code: 'member_session_not_found',
			})
		}
		if (session.role !== 'host') {
			return err({ code: 'unauthorized' })
		}

		const context = this.repository.getRoomById(session.roomId)
		if (!context) {
			return err({
				code: 'room_not_found',
			})
		}

		const member = context.state.membersById[session.memberId]
		if (!member) {
			return err({
				code: 'member_session_not_found',
			})
		}

		let nextState = context.state
		if (!member.connected) {
			const reconnectResult = applyRoomCommand(context.state, {
				type: 'RECONNECT_MEMBER',
				id: session.memberId,
				now: this.now(),
			})

			if (!reconnectResult.ok) {
				return reconnectResult
			}

			nextState = reconnectResult.value
			this.commitRoomState(nextState.roomId, nextState, {
				excludeMemberId: session.memberId,
			})
		}

		const replacedSocketId = this.repository.bindSocketToSession(
			input.memberSessionToken,
			input.socketId,
		)

		const snapshot = this.buildRoomHostSnapshot(nextState, session.memberId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				roomId: nextState.roomId,
				memberId: session.memberId,
				snapshot: snapshot.value,
			},
			replacedSocketId,
		})
	}

	resumePlayerRoom(
		input: ResumePlayerRoomInput,
	): ServiceResult<BoundServiceResponse<ResumePlayerRoomResponse>> {
		const session = this.repository.getMemberSession(input.memberSessionToken)
		if (!session) {
			return err({
				code: 'member_session_not_found',
			})
		}

		if (session.role !== 'player') {
			return err({ code: 'unauthorized' })
		}

		const context = this.repository.getRoomById(session.roomId)
		if (!context) {
			return err({
				code: 'room_not_found',
			})
		}

		const member = context.state.membersById[session.memberId]
		if (!member) {
			return err({
				code: 'member_session_not_found',
			})
		}

		let nextState = context.state
		if (!member.connected) {
			const reconnectResult = applyRoomCommand(context.state, {
				type: 'RECONNECT_MEMBER',
				id: session.memberId,
				now: this.now(),
			})

			if (!reconnectResult.ok) {
				return reconnectResult
			}

			nextState = reconnectResult.value
			this.commitRoomState(nextState.roomId, nextState, {
				excludeMemberId: session.memberId,
			})
		}

		const replacedSocketId = this.repository.bindSocketToSession(
			input.memberSessionToken,
			input.socketId,
		)

		const snapshot = this.buildRoomPlayerSnapshot(nextState, session.memberId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				roomId: nextState.roomId,
				memberId: session.memberId,
				snapshot: snapshot.value,
			},
			replacedSocketId,
		})
	}

	returnToLobby(input: ReturnToLobbyInput): ServiceResult<EmptyAckData> {
		const sessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)

		if (!sessionContext.ok) {
			return sessionContext
		}

		const nextStateResult = applyRoomCommand(sessionContext.value.state, {
			type: 'RETURN_TO_LOBBY',
			actorId: sessionContext.value.memberSession.memberId,
			now: this.now(),
		})

		if (!nextStateResult.ok) {
			return nextStateResult
		}

		this.commitRoomState(
			sessionContext.value.state.roomId,
			nextStateResult.value,
		)

		return ok({})
	}

	terminateRoom(input: TerminateRoomInput): ServiceResult<EmptyAckData> {
		const sessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)

		if (!sessionContext.ok) {
			return sessionContext
		}

		const { memberSession, state } = sessionContext.value
		if (
			memberSession.role !== 'host' ||
			memberSession.memberId !== state.hostId
		) {
			return err({ code: 'unauthorized' })
		}

		this.closeRoom(state.roomId, 'host_terminated')

		return ok({})
	}

	startGame(input: StartGameInput): ServiceResult<EmptyAckData> {
		const gameSession = prepareGameSession(this.countryPool, input.gameConfig)
		if (!gameSession.ok) {
			return gameSession
		}
		const sessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)
		if (!sessionContext.ok) {
			return sessionContext
		}

		const nextState = startRoomGame({
			gameId: createGameId(),
			room: sessionContext.value.state,
			session: gameSession.value,
			actorId: sessionContext.value.memberSession.memberId,
			now: this.now(),
		})
		if (!nextState.ok) {
			return nextState
		}

		this.commitRoomState(sessionContext.value.state.roomId, nextState.value)

		return ok({})
	}

	submitAnswer(input: SubmitAnswerInput): ServiceResult<SubmitAnswerResponse> {
		const memberSessionContext = this.getMemberSessionContext(
			input.memberSessionToken,
		)
		if (!memberSessionContext.ok) {
			return memberSessionContext
		}
		const { memberSession, state: room } = memberSessionContext.value

		const acceptedAt = this.now()
		const submittedState = submitRoomGameAnswer(room, {
			type: 'SUBMIT_ANSWER',
			participantId: memberSession.memberId,
			countryId: input.countryId,
			now: acceptedAt,
		})

		if (!submittedState.ok) {
			return submittedState
		}

		let nextState = submittedState.value
		if (this.shouldRevealImmediately(nextState)) {
			const revealedState = advanceActiveRoomGame(nextState, acceptedAt)

			if (revealedState.ok) {
				nextState = revealedState.value
			}
		}

		this.commitRoomState(room.roomId, nextState)

		return ok({
			acceptedAt,
		})
	}

	disconnectSocket(socketId: string): void {
		const session = this.repository.unbindSocket(socketId)
		if (!session) {
			return
		}

		const context = this.repository.getRoomById(session.roomId)
		if (!context) {
			return
		}

		const member = context.state.membersById[session.memberId]
		if (!member || !member.connected) {
			return
		}

		const disconnectedState = applyRoomCommand(context.state, {
			type: 'DISCONNECT_MEMBER',
			id: session.memberId,
			now: this.now(),
		})

		if (!disconnectedState.ok) {
			return
		}

		this.commitRoomState(context.state.roomId, disconnectedState.value)
	}

	shutdown(reason: RoomClosedEvent['reason'] = 'server_shutdown'): void {
		for (const context of this.repository.listRooms()) {
			this.closeRoom(context.state.roomId, reason)
		}
	}

	closeRoom(roomId: RoomId, reason: RoomClosedEvent['reason']): boolean {
		const context = this.repository.getRoomById(roomId)
		if (!context) {
			return false
		}

		this.hooks.onRoomClosed(context.state.roomId, reason)
		this.repository.deleteRoom(context.state.roomId)

		return true
	}

	private getMemberSessionContext(
		memberSessionToken: MemberSessionToken,
	): ServiceResult<{
		memberSession: MemberSessionRecord
		state: RoomState
	}> {
		const memberSession = this.repository.getMemberSession(memberSessionToken)
		if (!memberSession) {
			return err({
				code: 'member_session_not_found',
			})
		}

		const context = this.repository.getRoomById(memberSession.roomId)
		if (!context) {
			return err({
				code: 'room_not_found',
			})
		}

		return ok({
			memberSession,
			state: context.state,
		})
	}

	private buildRoomHostSnapshot(
		state: RoomState,
		memberId: MemberId,
	): ServiceResult<RoomHostView> {
		const snapshot = toHostRoomView(state, memberId)

		return snapshot
			? ok(snapshot)
			: err({
					code: 'internal_error',
				})
	}

	private buildRoomPlayerSnapshot(
		state: RoomState,
		memberId: MemberId,
	): ServiceResult<RoomPlayerView> {
		const snapshot = toPlayerRoomView(state, memberId)

		return snapshot
			? ok(snapshot)
			: err({
					code: 'internal_error',
				})
	}

	private commitRoomState(
		roomId: RoomId,
		nextState: RoomState,
		options: RoomUpdateOptions = {},
	): void {
		this.repository.setRoomState(roomId, nextState)
		this.rescheduleRoomAdvance(roomId)
		this.hooks.onRoomUpdated(roomId, options)
	}

	private rescheduleRoomAdvance(roomId: RoomId): void {
		const context = this.repository.getRoomById(roomId)
		if (!context) {
			return
		}

		const dueAt = getNextActiveRoomGameAdvanceAt(
			context.state,
			{
				revealDurationMs: this.revealDurationMs,
				leaderboardDurationMs: this.leaderboardDurationMs,
			},
		)

		if (dueAt === null) {
			this.repository.setScheduledRoomAdvance(roomId, null)
			return
		}

		const delayMs = Math.max(0, dueAt - this.now())
		const handle = setTimeout(() => {
			this.executeScheduledRoomAdvance(roomId, dueAt)
		}, delayMs)

		this.repository.setScheduledRoomAdvance(roomId, {
			dueAt,
			handle,
		})
	}

	private executeScheduledRoomAdvance(roomId: RoomId, dueAt: number): void {
		const context = this.repository.getRoomById(roomId)
		if (!context || context.scheduledAdvance?.dueAt !== dueAt) {
			return
		}

		const transitionedState = advanceActiveRoomGame(context.state, this.now())

		if (!transitionedState.ok) {
			this.rescheduleRoomAdvance(roomId)
			return
		}

		this.commitRoomState(roomId, transitionedState.value)
	}

	private shouldRevealImmediately(state: RoomState): boolean {
		if (state.phase !== 'active') {
			return false
		}

		if (state.activeGame.phase !== 'open') {
			return false
		}

		const connectedParticipantCount = Object.keys(
			state.activeGame.participantsById,
		).filter(participantId => {
			return state.membersById[participantId]?.connected
		}).length

		if (connectedParticipantCount < 1) {
			return false
		}

		return (
			getAnsweredParticipantCount(state.activeGame) >=
			connectedParticipantCount
		)
	}
}
