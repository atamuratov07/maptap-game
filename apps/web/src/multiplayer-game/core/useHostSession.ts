import type { RoomHostView } from '@maptap/game-domain/multiplayer'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatGatewayErrorMessage, toGatewayError } from './errors'
import {
	clearRoomSession,
	loadRoomSession,
	saveRoomSession,
} from './sessionStorage'
import { createSocketGateway } from './socketGateway'
import type { RoomHostSessionState, RoomSession } from './types'

interface UseRoomHostSessionResult {
	state: RoomHostSessionState
	actionPending: 'start' | 'submit' | null
	actionErrorMessage: string | null
	startGame: () => Promise<void>
	submitAnswer: (countryId: string) => Promise<void>
	retry: () => Promise<void>
	disconnect: () => void
}

interface RequestRun {
	runId: number
}

export function useRoomHostSession(roomCode: string): UseRoomHostSessionResult {
	const gateway = useMemo(() => createSocketGateway(), [])
	const [state, setState] = useState<RoomHostSessionState>({
		status: 'connecting',
		roomCode,
	})
	const [actionPending, setActionPending] =
		useState<UseRoomHostSessionResult['actionPending']>(null)
	const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
		null,
	)

	const identityRef = useRef<RoomSession | null>(null)
	const roomRef = useRef<RoomHostView | null>(null)
	const unsubscribeRef = useRef<(() => void) | null>(null)
	const reconnectTimerRef = useRef<number | null>(null)
	const requestRunIdRef = useRef(0)
	const resumeSessionRef = useRef<
		(
			storedSession: RoomSession,
			mode: 'connecting' | 'reconnecting',
			run: RequestRun,
		) => Promise<boolean>
	>(async () => false)

	const beginRequestRun = useCallback((): RequestRun => {
		const runId = requestRunIdRef.current + 1
		requestRunIdRef.current = runId

		return {
			runId,
		}
	}, [])

	const isActiveRun = useCallback((run: RequestRun): boolean => {
		return requestRunIdRef.current === run.runId
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

	const disconnect = useCallback(() => {
		clearReconnectTimer()
		clearSubscriptions()
		gateway.disconnect()
	}, [clearReconnectTimer, clearSubscriptions, gateway])

	const attachRoomSnapshot = useCallback(
		(identity: RoomSession, room: RoomHostView) => {
			clearReconnectTimer()
			clearSubscriptions()
			identityRef.current = identity
			roomRef.current = room
			setActionErrorMessage(null)
			setState({
				status: 'ready',
				roomCode: roomCode,
				identity,
				room,
			})

			unsubscribeRef.current = gateway.subscribeHostRoom({
				onRoomSnapshot: payload => {
					if (payload.roomId !== identity.roomId) {
						return
					}

					roomRef.current = payload.snapshot
					setState({
						status: 'ready',
						roomCode: roomCode,
						identity,
						room: payload.snapshot,
					})
				},
				onRoomClosed: payload => {
					if (payload.roomId !== identity.roomId) {
						return
					}

					clearRoomSession(roomCode, 'host')
					setState({
						status: 'closed',
						roomCode: roomCode,
						identity,
						room: roomRef.current,
						reason: payload.reason,
					})
				},
				onDisconnect: () => {
					setState({
						status: 'reconnecting',
						roomCode: roomCode,
						identity,
						room: roomRef.current,
					})
					clearReconnectTimer()
					reconnectTimerRef.current = setTimeout(() => {
						const reconnectRun = beginRequestRun()
						void resumeSessionRef.current(
							identity,
							'reconnecting',
							reconnectRun,
						)
					}, 1200)
				},
			})
		},
		[
			beginRequestRun,
			clearReconnectTimer,
			clearSubscriptions,
			gateway,
			roomCode,
		],
	)

	const resumeSession = useCallback(
		async (
			storedSession: RoomSession,
			mode: 'connecting' | 'reconnecting',
			run: RequestRun,
		): Promise<boolean> => {
			if (!isActiveRun(run)) {
				return false
			}

			if (mode === 'reconnecting') {
				setState({
					status: 'reconnecting',
					roomCode,
					identity: storedSession,
					room: roomRef.current,
				})
			} else {
				setState({
					status: 'connecting',
					roomCode: roomCode,
				})
			}

			try {
				const response = await gateway.resumeHostRoom({
					playerSessionToken: storedSession.playerSessionToken,
				})

				if (!isActiveRun(run)) {
					return false
				}

				const identity: RoomSession = {
					...storedSession,
					role: 'host',
					roomId: response.roomId,
					roomCode: roomCode,
					playerId: response.playerId,
					savedAt: Date.now(),
				}

				if (!isActiveRun(run)) {
					return false
				}

				saveRoomSession(identity)
				attachRoomSnapshot(identity, response.snapshot)
				return true
			} catch (error) {
				if (!isActiveRun(run)) {
					return false
				}

				const gatewayError = toGatewayError(error)
				if (
					gatewayError.code === 'player_session_not_found' ||
					gatewayError.code === 'unauthorized'
				) {
					clearRoomSession(roomCode, 'host')
					identityRef.current = null
					roomRef.current = null

					if (mode === 'reconnecting') {
						setState({
							status: 'error',
							roomCode: roomCode,
							message: 'РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ РІС…РѕРґ РёСЃС‚С‘Рє. Р’РѕР№РґРёС‚Рµ СЃРЅРѕРІР°.',
						})
					}

					return false
				}

				if (mode === 'reconnecting') {
					setState({
						status: 'error',
						roomCode: roomCode,
						message:
							'РЎРѕРµРґРёРЅРµРЅРёРµ РїРѕС‚РµСЂСЏРЅРѕ, Рё РєРѕРјРЅР°С‚Сѓ РЅРµ СѓРґР°Р»РѕСЃСЊ РІРѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ.',
					})
					return false
				}

				throw gatewayError
			}
		},
		[attachRoomSnapshot, gateway, isActiveRun, roomCode],
	)

	useEffect(() => {
		resumeSessionRef.current = resumeSession
	}, [resumeSession])

	const bootstrapSession = useCallback(async () => {
		const run = beginRequestRun()
		clearReconnectTimer()
		setActionErrorMessage(null)

		setState({
			status: 'connecting',
			roomCode: roomCode,
		})

		try {
			const storedSession = loadRoomSession(roomCode, 'host')
			if (!isActiveRun(run)) {
				return
			}

			if (!storedSession) {
				setState({
					status: 'error',
					roomCode,
					message: 'No saved host session for this room',
				})
				return
			}

			identityRef.current = storedSession
			const resumed = await resumeSession(storedSession, 'connecting', run)
			if (!isActiveRun(run)) {
				return
			}

			if (!resumed) {
				setState({
					status: 'error',
					roomCode,
					message: 'Saved host session expired or is invalid',
				})
			}
		} catch (error) {
			if (!isActiveRun(run)) {
				return
			}

			setState({
				status: 'error',
				roomCode: roomCode,
				message: formatGatewayErrorMessage(error),
			})
		}
	}, [beginRequestRun, clearReconnectTimer, isActiveRun, roomCode, resumeSession])

	useEffect(() => {
		void bootstrapSession()

		return () => {
			requestRunIdRef.current += 1
			disconnect()
		}
	}, [bootstrapSession, disconnect])

	const startGame = useCallback(async () => {
		if (state.status !== 'ready') {
			return
		}

		setActionPending('start')
		setActionErrorMessage(null)

		try {
			await gateway.startGame({})
		} catch (error) {
			setActionErrorMessage(formatGatewayErrorMessage(error))
		} finally {
			setActionPending(null)
		}
	}, [gateway, state.status])

	const submitAnswer = useCallback(
		async (countryId: string) => {
			if (state.status !== 'ready') {
				return
			}

			setActionPending('submit')
			setActionErrorMessage(null)

			try {
				await gateway.submitAnswer({
					countryId,
				})
			} catch (error) {
				setActionErrorMessage(formatGatewayErrorMessage(error))
			} finally {
				setActionPending(null)
			}
		},
		[gateway, state.status],
	)

	const retry = useCallback(async () => {
		await bootstrapSession()
	}, [bootstrapSession])

	return {
		state,
		actionPending,
		actionErrorMessage,
		startGame,
		submitAnswer,
		retry,
		disconnect,
	}
}
