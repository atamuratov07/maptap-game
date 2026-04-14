import type { RoomPlayerView } from '@maptap/game-domain/multiplayer'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatGatewayErrorMessage, toGatewayError } from './errors'
import {
	clearRoomSession,
	loadRoomSession,
	saveRoomSession,
} from './sessionStorage'
import { createSocketGateway } from './socketGateway'
import type { RoomPlayerSessionState, RoomSession } from './types'

interface UseRoomSessionResult {
	state: RoomPlayerSessionState
	actionPending: 'join' | 'start' | 'submit' | null
	actionErrorMessage: string | null
	joinRoom: (playerName: string) => Promise<void>
	submitAnswer: (countryId: string) => Promise<void>
	retry: () => Promise<void>
	disconnect: () => void
}

interface RequestRun {
	runId: number
}

export function useRoomPlayerSession(roomCode: string): UseRoomSessionResult {
	const gateway = useMemo(() => createSocketGateway(), [])
	const [state, setState] = useState<RoomPlayerSessionState>({
		status: 'connecting',
		roomCode,
		step: 'lookup',
	})
	const [actionPending, setActionPending] = useState<
		'join' | 'start' | 'submit' | null
	>(null)
	const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
		null,
	)

	const identityRef = useRef<RoomSession | null>(null)
	const roomRef = useRef<RoomPlayerView | null>(null)
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
		(identity: RoomSession, room: RoomPlayerView) => {
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

			unsubscribeRef.current = gateway.subscribePlayerRoom({
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

					clearRoomSession(roomCode, 'player')
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
					roomCode: roomCode,
					identity: storedSession,
					room: roomRef.current,
				})
			} else {
				setState({
					status: 'connecting',
					roomCode: roomCode,
					step: 'resume',
				})
			}

			try {
				const response = await gateway.resumePlayerRoom({
					playerSessionToken: storedSession.playerSessionToken,
				})

				if (!isActiveRun(run)) {
					return false
				}

				const identity: RoomSession = {
					...storedSession,
					role: 'player',
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
					clearRoomSession(roomCode, 'player')
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

		if (roomCode.length !== 6) {
			setState({
				status: 'error',
				roomCode: roomCode,
				message: 'РљРѕРґ РєРѕРјРЅР°С‚С‹ РґРѕР»Р¶РµРЅ СЃРѕРґРµСЂР¶Р°С‚СЊ СЂРѕРІРЅРѕ 6 СЃРёРјРІРѕР»РѕРІ.',
			})
			return
		}

		setState({
			status: 'connecting',
			roomCode: roomCode,
			step: 'lookup',
		})

		try {
			const lookupResponse = await gateway.lookupRoom({
				roomCode: roomCode,
			})

			if (!isActiveRun(run)) {
				return
			}

			if (!lookupResponse.exists) {
				clearRoomSession(roomCode, 'player')
				identityRef.current = null
				roomRef.current = null
				setState({
					status: 'error',
					roomCode: roomCode,
					message: 'РљРѕРјРЅР°С‚Р° РЅРµ РЅР°Р№РґРµРЅР°.',
				})
				return
			}

			const storedSession = loadRoomSession(roomCode, 'player')
			if (!isActiveRun(run)) {
				return
			}

			if (storedSession) {
				identityRef.current = storedSession
				const resumed = await resumeSession(storedSession, 'connecting', run)
				if (!isActiveRun(run)) {
					return
				}

				if (resumed) {
					return
				}

				setState({
					status: 'idle',
					roomCode: roomCode,
					roomInfo: lookupResponse,
					resumeMessage: 'РЎРѕС…СЂР°РЅС‘РЅРЅС‹Р№ РІС…РѕРґ РёСЃС‚С‘Рє. Р’РѕР№РґРёС‚Рµ СЃРЅРѕРІР°.',
				})
				return
			}

			setState({
				status: 'idle',
				roomCode: roomCode,
				roomInfo: lookupResponse,
				resumeMessage: null,
			})
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
	}, [beginRequestRun, clearReconnectTimer, gateway, isActiveRun, roomCode, resumeSession])

	useEffect(() => {
		void bootstrapSession()

		return () => {
			requestRunIdRef.current += 1
			disconnect()
		}
	}, [bootstrapSession, disconnect])

	const joinRoom = useCallback(
		async (playerName: string) => {
			if (state.status !== 'idle') {
				return
			}

			setActionPending('join')
			setActionErrorMessage(null)

			try {
				const response = await gateway.joinRoom({
					roomCode: roomCode,
					playerName: playerName.trim(),
				})

				const identity: RoomSession = {
					role: 'player',
					roomId: response.roomId,
					roomCode: response.roomCode,
					playerId: response.playerId,
					playerSessionToken: response.playerSessionToken,
					savedAt: Date.now(),
				}

				saveRoomSession(identity)
				attachRoomSnapshot(identity, response.snapshot)
			} catch (error) {
				setActionErrorMessage(formatGatewayErrorMessage(error))
			} finally {
				setActionPending(null)
			}
		},
		[attachRoomSnapshot, gateway, roomCode, state.status],
	)

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
		joinRoom,
		submitAnswer,
		retry,
		disconnect,
	}
}
