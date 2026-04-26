import {
	GAME_NAMESPACE,
	type Ack,
	type AckCallback,
	type ClientToServerEvents,
	type CreateRoomRequest,
	type CreateRoomResponse,
	type EmptyAckData,
	type HostRoomSnapshotEvent,
	type JoinRoomRequest,
	type JoinRoomResponse,
	type LookupRoomRequest,
	type LookupRoomResponse,
	type PlayerRoomSnapshotEvent,
	type ResumeHostRoomRequest,
	type ResumeHostRoomResponse,
	type ResumePlayerRoomRequest,
	type ResumePlayerRoomResponse,
	type ReturnToLobbyRequest,
	type RoomClosedEvent,
	type ServerToClientEvents,
	type StartGameRequest,
	type SubmitAnswerRequest,
	type SubmitAnswerResponse,
	type TerminateRoomRequest,
} from '@maptap/game-protocol'
import { io, type Socket } from 'socket.io-client'
import { toGatewayError } from './errors'

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>
type ClientEventName = keyof ClientToServerEvents

type ClientEventPayloadMap = {
	[TEvent in ClientEventName]: Parameters<ClientToServerEvents[TEvent]>[0]
}

type ClientEventResponseMap = {
	[TEvent in ClientEventName]: Parameters<
		ClientToServerEvents[TEvent]
	>[1] extends AckCallback<infer TResponse>
		? TResponse
		: never
}

interface TimedAckEmitter {
	emitWithAck<TEvent extends ClientEventName>(
		eventName: TEvent,
		payload: ClientEventPayloadMap[TEvent],
	): Promise<Ack<ClientEventResponseMap[TEvent]>>
}

interface HostRoomSubscriptionHandlers {
	onRoomSnapshot?: (payload: HostRoomSnapshotEvent) => void
	onRoomClosed?: (payload: RoomClosedEvent) => void
	onDisconnect?: (reason: string) => void
}
interface PlayerRoomSubscriptionHandlers {
	onRoomSnapshot?: (payload: PlayerRoomSnapshotEvent) => void
	onRoomClosed?: (payload: RoomClosedEvent) => void
	onDisconnect?: (reason: string) => void
}

export interface SocketGateway {
	createRoom: (payload: CreateRoomRequest) => Promise<CreateRoomResponse>
	lookupRoom: (payload: LookupRoomRequest) => Promise<LookupRoomResponse>
	joinRoom: (payload: JoinRoomRequest) => Promise<JoinRoomResponse>
	resumeHostRoom: (
		payload: ResumeHostRoomRequest,
	) => Promise<ResumeHostRoomResponse>
	resumePlayerRoom: (
		payload: ResumePlayerRoomRequest,
	) => Promise<ResumePlayerRoomResponse>
	returnToLobby: (payload: ReturnToLobbyRequest) => Promise<EmptyAckData>
	terminateRoom: (payload: TerminateRoomRequest) => Promise<EmptyAckData>
	startGame: (payload: StartGameRequest) => Promise<EmptyAckData>
	submitAnswer: (payload: SubmitAnswerRequest) => Promise<SubmitAnswerResponse>
	subscribeHostRoom: (handlers: HostRoomSubscriptionHandlers) => () => void
	subscribePlayerRoom: (handlers: PlayerRoomSubscriptionHandlers) => () => void
	disconnect: () => void
}

const CONNECT_TIMEOUT_MS = 5000
const REQUEST_TIMEOUT_MS = 5000

function buildSocketUrl(): string {
	const envUrl = import.meta.env.VITE_GAME_SERVER_ORIGIN?.trim()
	if (envUrl) {
		return `${envUrl.replace(/\/$/, '')}${GAME_NAMESPACE}`
	}

	return GAME_NAMESPACE
}

function unwrapAck<TResponse>(response: Ack<TResponse>): TResponse {
	if (response.ok) {
		return response.data
	}

	throw response.error
}

export function createSocketGateway(): SocketGateway {
	let socket: GameSocket | null = null
	let intentionalDisconnect = false

	function getSocket(): GameSocket {
		if (!socket) {
			socket = io(buildSocketUrl(), {
				autoConnect: false,
				reconnection: true,
			})
		}

		return socket
	}

	async function ensureConnected(): Promise<GameSocket> {
		const currentSocket = getSocket()
		if (currentSocket.connected) {
			return currentSocket
		}

		intentionalDisconnect = false

		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				cleanup()
				reject(
					toGatewayError(
						new Error('Не удалось подключиться к игровому серверу.'),
					),
				)
			}, CONNECT_TIMEOUT_MS)

			const cleanup = () => {
				clearTimeout(timeoutId)
				currentSocket.off('connect', handleConnect)
				currentSocket.off('connect_error', handleConnectError)
			}

			const handleConnect = () => {
				cleanup()
				resolve(currentSocket)
			}

			const handleConnectError = (error: Error) => {
				cleanup()
				reject(toGatewayError(error))
			}

			currentSocket.once('connect', handleConnect)
			currentSocket.once('connect_error', handleConnectError)
			currentSocket.connect()
		})
	}

	async function request<TEvent extends ClientEventName>(
		eventName: TEvent,
		payload: ClientEventPayloadMap[TEvent],
	): Promise<ClientEventResponseMap[TEvent]> {
		const currentSocket = await ensureConnected()
		const timedSocket = currentSocket.timeout(
			REQUEST_TIMEOUT_MS,
		) as unknown as TimedAckEmitter

		try {
			const response = await timedSocket.emitWithAck(eventName, payload)
			return unwrapAck(response)
		} catch (error) {
			throw toGatewayError(error)
		}
	}

	return {
		createRoom(payload) {
			return request('room:create', payload)
		},

		lookupRoom(payload) {
			return request('room:lookup', payload)
		},

		joinRoom(payload) {
			return request('room:join', payload)
		},

		resumePlayerRoom(payload) {
			return request('room:player-resume', payload)
		},

		resumeHostRoom(payload) {
			return request('room:host-resume', payload)
		},

		returnToLobby(payload) {
			return request('room:return-to-lobby', payload)
		},

		terminateRoom(payload) {
			return request('room:terminate', payload)
		},

		startGame(payload) {
			return request('game:start', payload)
		},

		submitAnswer(payload) {
			return request('game:submit-answer', payload)
		},

		subscribeHostRoom(handlers) {
			const currentSocket = getSocket()

			const handleRoomSnapshot = (payload: HostRoomSnapshotEvent) => {
				handlers.onRoomSnapshot?.(payload)
			}

			const handleRoomClosed = (payload: RoomClosedEvent) => {
				handlers.onRoomClosed?.(payload)
			}

			const handleDisconnect = (reason: string) => {
				if (intentionalDisconnect) {
					return
				}

				handlers.onDisconnect?.(reason)
			}

			currentSocket.on('room:host-snapshot', handleRoomSnapshot)
			currentSocket.on('room:closed', handleRoomClosed)
			currentSocket.on('disconnect', handleDisconnect)

			return () => {
				currentSocket.off('room:host-snapshot', handleRoomSnapshot)
				currentSocket.off('room:closed', handleRoomClosed)
				currentSocket.off('disconnect', handleDisconnect)
			}
		},

		subscribePlayerRoom(handlers) {
			const currentSocket = getSocket()

			const handleRoomSnapshot = (payload: PlayerRoomSnapshotEvent) => {
				handlers.onRoomSnapshot?.(payload)
			}

			const handleRoomClosed = (payload: RoomClosedEvent) => {
				handlers.onRoomClosed?.(payload)
			}

			const handleDisconnect = (reason: string) => {
				if (intentionalDisconnect) {
					return
				}

				handlers.onDisconnect?.(reason)
			}

			currentSocket.on('room:player-snapshot', handleRoomSnapshot)
			currentSocket.on('room:closed', handleRoomClosed)
			currentSocket.on('disconnect', handleDisconnect)

			return () => {
				currentSocket.off('room:player-snapshot', handleRoomSnapshot)
				currentSocket.off('room:closed', handleRoomClosed)
				currentSocket.off('disconnect', handleDisconnect)
			}
		},

		disconnect() {
			intentionalDisconnect = true
			const currentSocket = socket
			socket = null
			currentSocket?.disconnect()
		},
	}
}
