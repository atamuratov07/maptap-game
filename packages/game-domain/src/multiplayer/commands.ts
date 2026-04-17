import { type CommandError } from '../shared/errors'
import { err, ok, type Result } from '../shared/result'
import type { CountryId } from '../shared/types'
import { normalizePlayerName } from './factory'
import { canUsePlayerName, requireHost, requirePlayer } from './player'
import { archiveRound, createRound } from './round'
import type {
	LockedGameSubmission,
	PlayerId,
	RoomQuestionOpenState,
	RoomState,
} from './types'

export type RoomCommand =
	| {
			type: 'JOIN_PLAYER'
			playerId: PlayerId
			name: string
			now: number
	  }
	| {
			type: 'RECONNECT_PLAYER'
			playerId: PlayerId
			now: number
	  }
	| {
			type: 'DISCONNECT_PLAYER'
			playerId: PlayerId
			now: number
	  }
	| {
			type: 'START_GAME'
			actorPlayerId: PlayerId
			now: number
	  }
	| {
			type: 'SUBMIT_ANSWER'
			playerId: PlayerId
			countryId: CountryId
			now: number
	  }
	| {
			type: 'TERMINATE_GAME'
			now: number
	  }

export function applyRoomCommand(
	state: RoomState,
	command: RoomCommand,
): Result<RoomState, CommandError> {
	switch (command.type) {
		case 'JOIN_PLAYER': {
			if (state.phase !== 'lobby') {
				return err({
					code: 'room_not_joinable',
				})
			}

			const name = normalizePlayerName(command.name)
			if (name.length === 0) {
				return err({
					code: 'player_name_required',
				})
			}

			const existingPlayerResult = requirePlayer(state, command.playerId)
			if (existingPlayerResult.ok) {
				return err({
					code: 'player_already_joined',
				})
			}

			if (!canUsePlayerName(state, name)) {
				return err({
					code: 'player_name_taken',
				})
			}

			return ok({
				...state,
				playersById: {
					...state.playersById,
					[command.playerId]: {
						id: command.playerId,
						name,
						role: 'player',
						connected: true,
						joinedAt: command.now,
						lastConnectedAt: command.now,
						lastDisconnectedAt: null,
						score: 0,
						correctCount: 0,
					},
				},
				playerOrder: [...state.playerOrder, command.playerId],
			})
		}

		case 'RECONNECT_PLAYER': {
			const playerResult = requirePlayer(state, command.playerId)
			if (!playerResult.ok) {
				return playerResult
			}

			const player = playerResult.value

			if (player.connected) {
				return err({
					code: 'player_already_connected',
				})
			}

			return ok({
				...state,
				playersById: {
					...state.playersById,
					[command.playerId]: {
						...player,
						connected: true,
						lastConnectedAt: command.now,
					},
				},
			})
		}

		case 'DISCONNECT_PLAYER': {
			const playerResult = requirePlayer(state, command.playerId)
			if (!playerResult.ok) {
				return playerResult
			}

			const player = playerResult.value

			if (!player.connected) {
				return ok(state)
			}

			return ok({
				...state,
				playersById: {
					...state.playersById,
					[command.playerId]: {
						...player,
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

			const hostResult = requireHost(state, command.actorPlayerId)
			if (!hostResult.ok) {
				return hostResult
			}

			const nextState: RoomQuestionOpenState = {
				...state,
				phase: 'question_open',
				activeRound: createRound(
					state.gameSession.questionIds,
					state.gameSession.config,
					0,
					command.now,
				),
			}

			return ok(nextState)
		}

		case 'SUBMIT_ANSWER': {
			if (state.phase !== 'question_open') {
				return err({
					code: 'room_not_in_question_open',
				})
			}

			const playerResult = requirePlayer(state, command.playerId)
			if (!playerResult.ok) {
				return playerResult
			}

			const player = playerResult.value

			if (!player.connected) {
				return err({
					code: 'player_not_connected',
				})
			}

			if (state.activeRound.submissions[command.playerId]) {
				return err({
					code: 'player_already_submitted',
				})
			}

			if (!state.gameSession.eligibleIds.includes(command.countryId)) {
				return err({
					code: 'country_not_eligible',
				})
			}

			const submission: LockedGameSubmission = {
				playerId: command.playerId,
				countryId: command.countryId,
				submittedAt: command.now,
			}

			return ok({
				...state,
				activeRound: {
					...state.activeRound,
					submissions: {
						...state.activeRound.submissions,
						[command.playerId]: submission,
					},
				},
			})
		}

		case 'TERMINATE_GAME': {
			if (state.phase === 'finished') {
				return err({
					code: 'room_already_finished',
				})
			}

			if (state.phase === 'lobby' || state.phase === 'question_open') {
				return ok({
					phase: 'finished',
					roomId: state.roomId,
					roomCode: state.roomCode,
					hostPlayerId: state.hostPlayerId,
					playersById: state.playersById,
					playerOrder: state.playerOrder,
					gameSession: state.gameSession,
					createdAt: state.createdAt,
					completedRounds: state.completedRounds,
					finishedAt: command.now,
				})
			}

			const archivedRound = archiveRound(state.activeRound)

			return ok({
				phase: 'finished',
				roomId: state.roomId,
				roomCode: state.roomCode,
				hostPlayerId: state.hostPlayerId,
				playersById: state.playersById,
				playerOrder: state.playerOrder,
				gameSession: state.gameSession,
				createdAt: state.createdAt,
				completedRounds: [...state.completedRounds, archivedRound],
				finishedAt: command.now,
			})
		}
	}
}
