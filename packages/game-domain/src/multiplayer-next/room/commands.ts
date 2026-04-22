import { err, ok, type Result } from '../../shared/result'
import type { CommandError } from '../errors'
import type { GameOpenState } from '../game/types'
import { normalizeMemberName } from './factory'
import { canUseMemberName, requireHost, requireMember } from './member'
import {
	toRoomActiveState,
	toRoomLobbyState,
	type MemberId,
	type RoomState,
} from './types'

export type RoomCommand =
	| {
			type: 'JOIN_MEMBER'
			id: MemberId
			name: string
			now: number
	  }
	| {
			type: 'RECONNECT_MEMBER'
			id: MemberId
			now: number
	  }
	| {
			type: 'DISCONNECT_MEMBER'
			id: MemberId
			now: number
	  }
	| {
			type: 'START_GAME'
			actorId: MemberId
			activeGame: GameOpenState
	  }
	| {
			type: 'RETURN_TO_LOBBY'
			actorId: MemberId
			now: number
	  }

export function applyRoomCommand(
	state: RoomState,
	command: RoomCommand,
): Result<RoomState, CommandError> {
	switch (command.type) {
		case 'JOIN_MEMBER': {
			if (state.phase !== 'lobby') {
				return err({
					code: 'room_not_joinable',
				})
			}

			const name = normalizeMemberName(command.name)
			if (name.length === 0) {
				return err({
					code: 'member_name_required',
				})
			}

			const existingMemberResult = requireMember(state, command.id)
			if (existingMemberResult.ok) {
				return err({
					code: 'member_already_joined',
				})
			}

			if (!canUseMemberName(state, name)) {
				return err({
					code: 'member_name_taken',
				})
			}

			return ok({
				...state,
				membersById: {
					...state.membersById,
					[command.id]: {
						id: command.id,
						name,
						role: 'player',
						connected: true,
						joinedAt: command.now,
						lastConnectedAt: command.now,
						lastDisconnectedAt: null,
					},
				},
				memberOrder: [...state.memberOrder, command.id],
			})
		}

		case 'RECONNECT_MEMBER': {
			const memberResult = requireMember(state, command.id)
			if (!memberResult.ok) {
				return memberResult
			}

			const member = memberResult.value

			if (member.connected) {
				return err({
					code: 'member_already_connected',
				})
			}

			return ok({
				...state,
				membersById: {
					...state.membersById,
					[command.id]: {
						...member,
						connected: true,
						lastConnectedAt: command.now,
					},
				},
			})
		}

		case 'DISCONNECT_MEMBER': {
			const memberResult = requireMember(state, command.id)
			if (!memberResult.ok) {
				return memberResult
			}

			const member = memberResult.value

			if (!member.connected) {
				return ok(state)
			}

			return ok({
				...state,
				membersById: {
					...state.membersById,
					[command.id]: {
						...member,
						connected: false,
						lastDisconnectedAt: command.now,
					},
				},
			})
		}

		case 'START_GAME': {
			if (state.phase !== 'lobby') {
				return err({
					code: 'room_not_in_lobby',
				})
			}

			const hostResult = requireHost(state, command.actorId)
			if (!hostResult.ok) {
				return hostResult
			}

			const participantIds = Object.keys(command.activeGame.participantsById)
			if (participantIds.length === 0) {
				return err({
					code: 'game_has_no_participants',
				})
			}

			if (
				participantIds.some(
					participantId => !state.membersById[participantId],
				)
			) {
				return err({
					code: 'game_participant_not_in_room',
				})
			}

			return ok(toRoomActiveState(state, command.activeGame))
		}

		case 'RETURN_TO_LOBBY': {
			if (state.phase !== 'finished') {
				return err({
					code: 'room_not_finished',
				})
			}

			const hostResult = requireHost(state, command.actorId)
			if (!hostResult.ok) {
				return hostResult
			}

			return ok(toRoomLobbyState(state))
		}
	}
}
