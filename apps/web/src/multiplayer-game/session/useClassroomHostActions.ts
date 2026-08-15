import type { RoomHostView } from '@georally/game-domain/multiplayer'
import { useCallback } from 'react'
import type { SocketGateway } from '../api/socketGateway'
import type { RoomRuntimeState } from './useRoomRuntime'

type ClassroomHostAction = 'reveal' | 'advance'

interface UseClassroomHostActionsResult {
	revealRound: () => Promise<void>
	advanceRound: () => Promise<void>
}

export function useClassroomHostActions({
	state,
	gateway,
	runAction,
}: {
	state: RoomRuntimeState<RoomHostView>
	gateway: SocketGateway
	runAction: (
		action: ClassroomHostAction,
		task: () => Promise<void>,
	) => Promise<void>
}): UseClassroomHostActionsResult {
	const revealRound = useCallback(async () => {
		if (state.status !== 'ready') {
			return
		}

		await runAction('reveal', async () => {
			await gateway.revealRound({})
		})
	}, [gateway, runAction, state.status])
	const advanceRound = useCallback(async () => {
		if (state.status !== 'ready') {
			return
		}

		await runAction('advance', async () => {
			await gateway.advanceRound({})
		})
	}, [gateway, runAction, state.status])

	return {
		revealRound,
		advanceRound,
	}
}
