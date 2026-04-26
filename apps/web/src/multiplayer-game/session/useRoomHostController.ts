import type {
	GameConfig,
	RoomHostView,
} from '@maptap/game-domain/multiplayer-next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSocketGateway } from '../api/socketGateway'
import { clearRoomGameConfig } from '../model/gameConfig'
import {
	clearRoomSession,
	loadRoomSession,
	saveRoomSession,
} from './sessionStorage'
import type { RoomSession } from './types'
import { useActionStatus } from './useActionStatus'
import {
	useRoomRuntime,
	type RoomRuntimeAdapter,
	type RoomRuntimeState,
} from './useRoomRuntime'

type RoomHostControllerState = RoomRuntimeState<RoomHostView>
type RoomHostAction = 'start' | 'submit' | 'return-lobby' | 'terminate-room'

interface UseRoomHostControllerResult {
	state: RoomHostControllerState
	actionPending: RoomHostAction | null
	actionErrorMessage: string | null
	startGame: (config: GameConfig) => Promise<void>
	submitAnswer: (countryId: string) => Promise<void>
	returnToLobby: () => Promise<void>
	terminateRoom: () => Promise<void>
	retry: () => Promise<void>
}

export function useRoomHostController(
	roomCode: string,
): UseRoomHostControllerResult {
	const gateway = useMemo(() => createSocketGateway(), [])
	const hostConnectionPort = useMemo(
		(): RoomRuntimeAdapter<RoomHostView> => ({
			resume: (session: RoomSession) =>
				gateway.resumeHostRoom({
					memberSessionToken: session.memberSessionToken,
				}),
			subscribe: handlers => gateway.subscribeHostRoom(handlers),
			close: () => gateway.disconnect(),
		}),
		[gateway],
	)
	const runtime = useRoomRuntime({
		roomCode,
		adapter: hostConnectionPort,
	})

	const [entryErrorMessage, setEntryErrorMessage] = useState<string | null>(
		null,
	)
	const { actionPending, actionErrorMessage, clearActionError, runAction } =
		useActionStatus<RoomHostAction>()

	const state = useMemo<RoomHostControllerState>(() => {
		if (entryErrorMessage) {
			return {
				status: 'error',
				roomCode,
				message: entryErrorMessage,
			}
		}

		return runtime.state
	}, [entryErrorMessage, roomCode, runtime.state])

	const bootstrap = useCallback(async () => {
		setEntryErrorMessage(null)
		clearActionError()

		if (roomCode.length !== 6) {
			setEntryErrorMessage('Код комнаты должен состоять из 6 символов.')
			return
		}

		const storedSession = loadRoomSession(roomCode, 'host')
		if (!storedSession) {
			setEntryErrorMessage('Для этой комнаты нет сохранённой сессии хоста.')
			return
		}

		const result = await runtime.connect(storedSession)
		switch (result.kind) {
			case 'connected':
				saveRoomSession(result.session)
				return
			case 'rejected':
				clearRoomSession(roomCode, 'host')
				setEntryErrorMessage(
					'Сохранённая сессия хоста истекла или недействительна.',
				)
				return
			case 'error':
			case 'aborted':
				return
		}
	}, [clearActionError, runtime.connect, roomCode])

	const startGame = useCallback(
		async (gameConfig: GameConfig) => {
			if (runtime.state.status !== 'ready') {
				return
			}

			await runAction('start', async () => {
				await gateway.startGame({ gameConfig })
			})
		},
		[gateway, runAction, runtime.state.status],
	)

	const submitAnswer = useCallback(
		async (countryId: string) => {
			if (runtime.state.status !== 'ready') {
				return
			}

			await runAction('submit', async () => {
				await gateway.submitAnswer({ countryId })
			})
		},
		[gateway, runAction, runtime.state.status],
	)

	const returnToLobby = useCallback(async () => {
		if (runtime.state.status !== 'ready') {
			return
		}

		await runAction('return-lobby', async () => {
			await gateway.returnToLobby({})
		})
	}, [gateway, runAction, runtime.state.status])

	const terminateRoom = useCallback(async () => {
		if (runtime.state.status !== 'ready') {
			return
		}

		await runAction('terminate-room', async () => {
			await gateway.terminateRoom({})
		})
	}, [gateway, runAction, runtime.state.status])

	useEffect(() => {
		void bootstrap()
		return () => {
			runtime.disconnect()
		}
	}, [bootstrap, runtime.disconnect])

	useEffect(() => {
		if (runtime.state.status === 'closed') {
			clearRoomSession(roomCode, 'host')
			clearRoomGameConfig(roomCode)
		}
	}, [roomCode, runtime.state.status])

	const retry = useCallback(async () => {
		await bootstrap()
	}, [bootstrap])

	return {
		state,
		actionPending,
		actionErrorMessage,
		startGame,
		submitAnswer,
		returnToLobby,
		terminateRoom,
		retry,
	}
}
