import type {
	MemberId,
	RoomCode,
	RoomId,
} from '@maptap/game-domain/multiplayer-next/room'
import type { RoomClosedEvent } from '@maptap/game-protocol'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatGatewayErrorMessage, toGatewayError } from '../api/errors'
import type { RoomSession } from './types'

export type RoomRuntimeState<TView> =
	| {
			status: 'connecting'
			roomCode: RoomCode
	  }
	| {
			status: 'ready'
			roomCode: RoomCode
			session: RoomSession
			room: TView
	  }
	| {
			status: 'reconnecting'
			roomCode: RoomCode
			session: RoomSession
			room: TView | null
	  }
	| {
			status: 'closed'
			roomCode: RoomCode
			session: RoomSession | null
			room: TView | null
			reason: RoomClosedEvent['reason']
	  }
	| {
			status: 'error'
			roomCode: RoomCode
			message: string
	  }

type RoomSubscriptionHandlers<TView> = {
	onRoomSnapshot: (payload: { roomId: RoomId; snapshot: TView }) => void
	onRoomClosed: (payload: RoomClosedEvent) => void
	onDisconnect: (reason: string) => void
}

export type RoomRuntimeAdapter<TView> = {
	resume: (session: RoomSession) => Promise<{
		roomId: RoomId
		memberId: MemberId
		snapshot: TView
	}>
	subscribe: (handlers: RoomSubscriptionHandlers<TView>) => () => void
	close: () => void
}

export type ConnectRoomSessionResult =
	| { kind: 'connected'; session: RoomSession }
	| { kind: 'rejected' }
	| { kind: 'error' }
	| { kind: 'aborted' }

interface UseRoomRuntimeOptions<TView> {
	roomCode: RoomCode
	adapter: RoomRuntimeAdapter<TView>
}

interface UseRoomRuntimeResult<TView> {
	state: RoomRuntimeState<TView>
	connect: (
		session: RoomSession,
		mode?: 'connecting' | 'reconnecting',
	) => Promise<ConnectRoomSessionResult>
	acceptSession: (session: RoomSession, snapshot: TView) => void
	disconnect: () => void
}

function isRejectedSessionError(error: unknown): boolean {
	const gatewayError = toGatewayError(error)
	return (
		gatewayError.code === 'member_session_not_found' ||
		gatewayError.code === 'unauthorized'
	)
}

export function useRoomRuntime<TView>({
	roomCode,
	adapter,
}: UseRoomRuntimeOptions<TView>): UseRoomRuntimeResult<TView> {
	const [state, setState] = useState<RoomRuntimeState<TView>>({
		status: 'connecting',
		roomCode,
	})
	const roomRef = useRef<TView | null>(null)
	const unsubscribeRef = useRef<(() => void) | null>(null)
	const reconnectTimerRef = useRef<number | null>(null)
	const requestRunIdRef = useRef(0)
	const reconnectRef = useRef<
		(
			session: RoomSession,
			mode?: 'connecting' | 'reconnecting',
		) => Promise<ConnectRoomSessionResult>
	>(async () => ({ kind: 'aborted' }))

	const beginRun = useCallback(() => {
		return ++requestRunIdRef.current
	}, [])

	const isActiveRun = useCallback((runId: number): boolean => {
		return requestRunIdRef.current === runId
	}, [])

	const clearReconnectTimer = useCallback(() => {
		if (reconnectTimerRef.current !== null) {
			clearTimeout(reconnectTimerRef.current)
			reconnectTimerRef.current = null
		}
	}, [])

	const clearSubscriptions = useCallback(() => {
		unsubscribeRef.current?.()
		unsubscribeRef.current = null
	}, [])

	const stopConnection = useCallback(() => {
		requestRunIdRef.current++
		clearReconnectTimer()
		clearSubscriptions()
	}, [clearReconnectTimer, clearSubscriptions])

	const disconnect = useCallback(() => {
		stopConnection()
		adapter.close()
		roomRef.current = null
	}, [adapter, stopConnection])

	const attachSession = useCallback(
		(session: RoomSession, snapshot: TView) => {
			if (session.roomCode !== roomCode) {
				throw new Error('Cannot attach a session for a different room.')
			}

			clearReconnectTimer()
			clearSubscriptions()

			roomRef.current = snapshot

			setState({
				status: 'ready',
				roomCode,
				session,
				room: snapshot,
			})

			unsubscribeRef.current = adapter.subscribe({
				onRoomSnapshot: payload => {
					if (payload.roomId !== session.roomId) {
						return
					}

					roomRef.current = payload.snapshot
					setState({
						status: 'ready',
						roomCode,
						session,
						room: payload.snapshot,
					})
				},
				onRoomClosed: payload => {
					if (payload.roomId !== session.roomId) {
						return
					}

					stopConnection()
					setState({
						status: 'closed',
						roomCode,
						session,
						room: roomRef.current,
						reason: payload.reason,
					})
					setTimeout(() => {
						adapter.close()
					}, 0)
				},
				onDisconnect: () => {
					setState({
						status: 'reconnecting',
						roomCode,
						session,
						room: roomRef.current,
					})

					clearReconnectTimer()
					reconnectTimerRef.current = setTimeout(() => {
						void reconnectRef.current(session, 'reconnecting')
					}, 1200)
				},
			})
		},
		[
			clearReconnectTimer,
			clearSubscriptions,
			adapter,
			roomCode,
			stopConnection,
		],
	)

	const connect = useCallback(
		async (
			session: RoomSession,
			mode: 'connecting' | 'reconnecting' = 'connecting',
		): Promise<ConnectRoomSessionResult> => {
			const runId = beginRun()
			clearReconnectTimer()

			if (mode === 'reconnecting') {
				setState({
					status: 'reconnecting',
					roomCode,
					session,
					room: roomRef.current,
				})
			} else {
				setState({
					status: 'connecting',
					roomCode,
				})
			}

			try {
				const response = await adapter.resume(session)
				if (!isActiveRun(runId)) {
					return { kind: 'aborted' }
				}

				const nextSession: RoomSession = {
					...session,
					roomId: response.roomId,
					roomCode,
					memberId: response.memberId,
					savedAt: Date.now(),
				}

				attachSession(nextSession, response.snapshot)
				return { kind: 'connected', session: nextSession }
			} catch (error) {
				if (!isActiveRun(runId)) {
					return { kind: 'aborted' }
				}

				if (isRejectedSessionError(error)) {
					disconnect()
					if (mode === 'reconnecting') {
						setState({
							status: 'error',
							roomCode,
							message:
								'Сохранённая сессия комнаты истекла или недействительна.',
						})
					}
					return { kind: 'rejected' }
				}

				setState({
					status: 'error',
					roomCode,
					message: formatGatewayErrorMessage(error),
				})
				return { kind: 'error' }
			}
		},
		[
			attachSession,
			beginRun,
			clearReconnectTimer,
			disconnect,
			isActiveRun,
			adapter,
			roomCode,
		],
	)

	useEffect(() => {
		reconnectRef.current = connect
	}, [connect])

	useEffect(() => {
		return () => {
			disconnect()
		}
	}, [disconnect])

	return {
		state,
		connect,
		acceptSession: attachSession,
		disconnect,
	}
}
