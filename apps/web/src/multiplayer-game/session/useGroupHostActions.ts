import type { RoomHostView } from '@maptap/game-domain/multiplayer'
import { useCallback } from 'react'
import type { SocketGateway } from '../api/socketGateway'
import type { RoomRuntimeState } from './useRoomRuntime'

type GroupHostAction = 'submit'

interface UseGroupHostActionsResult {
	submitAnswer: (countryId: string) => Promise<void>
}

export function useGroupHostActions({
	state,
	gateway,
	runAction,
}: {
	state: RoomRuntimeState<RoomHostView>
	gateway: SocketGateway
	runAction: (
		action: GroupHostAction,
		task: () => Promise<void>,
	) => Promise<void>
}): UseGroupHostActionsResult {
	const submitAnswer = useCallback(
		async (countryId: string) => {
			if (state.status !== 'ready') {
				return
			}

			await runAction('submit', async () => {
				await gateway.submitAnswer({ countryId })
			})
		},
		[gateway, runAction, state.status],
	)

	return {
		submitAnswer,
	}
}
