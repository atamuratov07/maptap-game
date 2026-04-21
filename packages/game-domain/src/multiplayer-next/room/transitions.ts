import type { CommandError } from '../errors'
import { err, ok, type Result } from '../../shared/result'
import {
	toRoomFinishedState,
	type RoomActiveCompletedState,
	type RoomState,
} from './types'

export type RoomTransition = {
	type: 'FINISH_ACTIVE_GAME'
	now: number
}

export function applyRoomTransition(
	state: RoomState,
	transition: RoomTransition,
): Result<RoomState, CommandError> {
	switch (transition.type) {
		case 'FINISH_ACTIVE_GAME': {
			if (state.phase !== 'active') {
				return err({
					code: 'room_not_active',
				})
			}

			if (state.activeGame.phase !== 'completed') {
				return err({
					code: 'active_game_not_completed',
				})
			}

			const completedState: RoomActiveCompletedState = {
				...state,
				activeGame: state.activeGame,
			}

			return ok(toRoomFinishedState(completedState, transition.now))
		}
	}
}
