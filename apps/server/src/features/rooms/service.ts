import { err, ok, type CountryPool, type Result } from '@maptap/game-domain'
import {
	applyRoomCommand,
	applyRoomTransition,
	createGameRoom,
	getAnsweredPlayerCount,
	getConnectedPlayerCount,
	prepareGameSession,
	toHostRoomView,
	toPlayerRoomView,
	type GameConfig,
	type PlayerId,
	type RoomHostView,
	type RoomId,
	type RoomPlayerView,
	type RoomState,
} from '@maptap/game-domain/multiplayer'
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
	createPlayerId,
	createPlayerSessionToken,
	createRoomCode,
	createRoomId,
} from './ids.js'
import type {
	PlayerSessionRecord,
	RoomsRepository,
	RoomTransitionAction,
} from './repository.js'
import type { BoundServiceResponse, PlayerSessionToken } from './types.js'

type ServiceResult<T> = Result<T, GameProtocolError>

interface RoomUpdateOptions {
	excludePlayerId?: PlayerId
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
	gameConfig: GameConfig
	socketId: string
}

export interface JoinRoomInput {
	roomCode: string
	playerName: string
	socketId: string
}

export interface ResumeHostRoomInput {
	playerSessionToken: PlayerSessionToken
	socketId: string
}
export interface ResumePlayerRoomInput {
	playerSessionToken: PlayerSessionToken
	socketId: string
}

export interface StartGameInput {
	playerSessionToken: PlayerSessionToken
}

export interface SubmitAnswerInput {
	playerSessionToken: PlayerSessionToken
	countryId: string
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

		const hostPlayer = context.state.playersById[context.state.hostPlayerId]

		return {
			exists: true,
			roomCode: context.state.roomCode,
			phase: context.state.phase,
			joinable: context.state.phase === 'lobby',
			playerCount: context.state.playerOrder.length,
			hostName: hostPlayer?.name ?? 'Host',
		}
	}

	createRoom(
		input: CreateRoomInput,
	): ServiceResult<BoundServiceResponse<CreateRoomResponse>> {
		const session = prepareGameSession(this.countryPool, input.gameConfig)
		if (!session.ok) {
			return session
		}

		const roomId = createRoomId()
		const roomCode = createRoomCode(
			code => !this.repository.hasRoomCode(code),
		)
		const hostPlayerId = createPlayerId()
		const roomResult = createGameRoom({
			roomId,
			roomCode,
			hostPlayerId,
			hostName: input.hostName,
			session: session.value,
			now: this.now(),
		})

		if (!roomResult.ok) {
			return roomResult
		}

		this.repository.createRoom(roomResult.value)

		const playerSessionToken = createPlayerSessionToken()
		this.repository.createPlayerSession({
			role: 'host',
			token: playerSessionToken,
			roomId,
			playerId: hostPlayerId,
			socketId: input.socketId,
		})

		const snapshot = this.buildRoomHostSnapshot(
			roomResult.value,
			hostPlayerId,
		)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				role: 'host',
				roomId,
				roomCode,
				playerId: hostPlayerId,
				playerSessionToken,
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

		const playerId = createPlayerId()
		const nextState = applyRoomCommand(context.state, {
			type: 'JOIN_PLAYER',
			playerId,
			name: input.playerName,
			now: this.now(),
		})

		if (!nextState.ok) {
			return nextState
		}

		this.commitRoomState(context.state.roomId, nextState.value, {
			excludePlayerId: playerId,
		})

		const playerSessionToken = createPlayerSessionToken()
		this.repository.createPlayerSession({
			role: 'player',
			token: playerSessionToken,
			roomId: nextState.value.roomId,
			playerId,
			socketId: input.socketId,
		})

		const snapshot = this.buildRoomPlayerSnapshot(nextState.value, playerId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				role: 'player',
				roomId: nextState.value.roomId,
				roomCode: nextState.value.roomCode,
				playerId,
				playerSessionToken,
				snapshot: snapshot.value,
			},
		})
	}

	resumeHostRoom(
		input: ResumeHostRoomInput,
	): ServiceResult<BoundServiceResponse<ResumeHostRoomResponse>> {
		const session = this.repository.getPlayerSession(input.playerSessionToken)
		if (!session) {
			return err({
				code: 'player_session_not_found',
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

		const player = context.state.playersById[session.playerId]
		if (!player) {
			return err({
				code: 'player_session_not_found',
			})
		}

		let nextState = context.state
		if (!player.connected) {
			const reconnectResult = applyRoomCommand(context.state, {
				type: 'RECONNECT_PLAYER',
				playerId: session.playerId,
				now: this.now(),
			})

			if (!reconnectResult.ok) {
				return reconnectResult
			}

			nextState = reconnectResult.value
			this.commitRoomState(nextState.roomId, nextState, {
				excludePlayerId: session.playerId,
			})
		}

		const replacedSocketId = this.repository.bindSocketToSession(
			input.playerSessionToken,
			input.socketId,
		)

		const snapshot = this.buildRoomHostSnapshot(nextState, session.playerId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				roomId: nextState.roomId,
				playerId: session.playerId,
				snapshot: snapshot.value,
			},
			replacedSocketId,
		})
	}

	resumePlayerRoom(
		input: ResumePlayerRoomInput,
	): ServiceResult<BoundServiceResponse<ResumePlayerRoomResponse>> {
		const session = this.repository.getPlayerSession(input.playerSessionToken)
		if (!session) {
			return err({
				code: 'player_session_not_found',
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

		const player = context.state.playersById[session.playerId]
		if (!player) {
			return err({
				code: 'player_session_not_found',
			})
		}

		let nextState = context.state
		if (!player.connected) {
			const reconnectResult = applyRoomCommand(context.state, {
				type: 'RECONNECT_PLAYER',
				playerId: session.playerId,
				now: this.now(),
			})

			if (!reconnectResult.ok) {
				return reconnectResult
			}

			nextState = reconnectResult.value
			this.commitRoomState(nextState.roomId, nextState, {
				excludePlayerId: session.playerId,
			})
		}

		const replacedSocketId = this.repository.bindSocketToSession(
			input.playerSessionToken,
			input.socketId,
		)

		const snapshot = this.buildRoomPlayerSnapshot(nextState, session.playerId)
		if (!snapshot.ok) {
			return snapshot
		}

		return ok({
			response: {
				roomId: nextState.roomId,
				playerId: session.playerId,
				snapshot: snapshot.value,
			},
			replacedSocketId,
		})
	}

	startGame(input: StartGameInput): ServiceResult<EmptyAckData> {
		const sessionContext = this.getSessionContext(input.playerSessionToken)
		if (!sessionContext.ok) {
			return sessionContext
		}

		const nextState = applyRoomCommand(sessionContext.value.state, {
			type: 'START_GAME',
			actorPlayerId: sessionContext.value.session.playerId,
			now: this.now(),
		})

		if (!nextState.ok) {
			return nextState
		}

		this.commitRoomState(sessionContext.value.state.roomId, nextState.value)

		return ok({})
	}

	submitAnswer(input: SubmitAnswerInput): ServiceResult<SubmitAnswerResponse> {
		const sessionContext = this.getSessionContext(input.playerSessionToken)
		if (!sessionContext.ok) {
			return sessionContext
		}

		const acceptedAt = this.now()
		const submittedState = applyRoomCommand(sessionContext.value.state, {
			type: 'SUBMIT_ANSWER',
			playerId: sessionContext.value.session.playerId,
			countryId: input.countryId,
			now: acceptedAt,
		})

		if (!submittedState.ok) {
			return submittedState
		}

		let nextState = submittedState.value
		if (this.shouldRevealImmediately(nextState)) {
			const revealedState = applyRoomTransition(nextState, {
				type: 'REVEAL_QUESTION',
				now: acceptedAt,
			})

			if (revealedState.ok) {
				nextState = revealedState.value
			}
		}

		this.commitRoomState(sessionContext.value.state.roomId, nextState)

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

		const player = context.state.playersById[session.playerId]
		if (!player || !player.connected) {
			return
		}

		const disconnectedState = applyRoomCommand(context.state, {
			type: 'DISCONNECT_PLAYER',
			playerId: session.playerId,
			now: this.now(),
		})

		if (!disconnectedState.ok) {
			return
		}

		this.commitRoomState(context.state.roomId, disconnectedState.value)
	}

	shutdown(reason: RoomClosedEvent['reason'] = 'server_shutdown'): void {
		this.repository.clearAllScheduledTransitions()

		for (const context of this.repository.listRooms()) {
			this.hooks.onRoomClosed(context.state.roomId, reason)
		}
	}

	private getSessionContext(
		playerSessionToken: PlayerSessionToken,
	): ServiceResult<{
		session: PlayerSessionRecord
		state: RoomState
	}> {
		const session = this.repository.getPlayerSession(playerSessionToken)
		if (!session) {
			return err({
				code: 'player_session_not_found',
			})
		}

		const context = this.repository.getRoomById(session.roomId)
		if (!context) {
			return err({
				code: 'room_not_found',
			})
		}

		return ok({
			session,
			state: context.state,
		})
	}

	private buildRoomHostSnapshot(
		state: RoomState,
		playerId: PlayerId,
	): ServiceResult<RoomHostView> {
		const snapshot = toHostRoomView(state, playerId)

		return snapshot
			? ok(snapshot)
			: err({
					code: 'internal_error',
				})
	}

	private buildRoomPlayerSnapshot(
		state: RoomState,
		playerId: PlayerId,
	): ServiceResult<RoomPlayerView> {
		const snapshot = toPlayerRoomView(state, playerId)

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
		this.rescheduleRoomTransition(roomId)
		this.hooks.onRoomUpdated(roomId, options)
	}

	private rescheduleRoomTransition(roomId: RoomId): void {
		const context = this.repository.getRoomById(roomId)
		if (!context) {
			return
		}

		let action: RoomTransitionAction | null = null
		let dueAt: number | null = null

		if (context.state.phase === 'question_open') {
			action = 'REVEAL_QUESTION'
			dueAt = context.state.activeRound.deadlineAt
		} else if (context.state.phase === 'question_revealed') {
			action = 'SHOW_LEADERBOARD'
			dueAt = context.state.activeRound.revealedAt + this.revealDurationMs
		} else if (context.state.phase === 'leaderboard') {
			action = 'ADVANCE_TO_NEXT_QUESTION'
			dueAt =
				context.state.activeRound.leaderboardShownAt +
				this.leaderboardDurationMs
		}

		if (!action || dueAt === null) {
			this.repository.setScheduledTransition(roomId, null)
			return
		}

		const delayMs = Math.max(0, dueAt - this.now())
		const handle = setTimeout(() => {
			this.executeScheduledTransition(roomId, action)
		}, delayMs)

		this.repository.setScheduledTransition(roomId, {
			action,
			dueAt,
			handle,
		})
	}

	private executeScheduledTransition(
		roomId: RoomId,
		action: RoomTransitionAction,
	): void {
		const context = this.repository.getRoomById(roomId)
		if (!context || context.scheduledTransition?.action !== action) {
			return
		}

		const transitionedState = applyRoomTransition(context.state, {
			type: action,
			now: this.now(),
		})

		if (!transitionedState.ok) {
			this.rescheduleRoomTransition(roomId)
			return
		}

		this.commitRoomState(roomId, transitionedState.value)
	}

	private shouldRevealImmediately(state: RoomState): boolean {
		if (state.phase !== 'question_open') {
			return false
		}

		const connectedPlayerCount = getConnectedPlayerCount(state)
		if (connectedPlayerCount < 1) {
			return false
		}

		return getAnsweredPlayerCount(state) >= connectedPlayerCount
	}
}
