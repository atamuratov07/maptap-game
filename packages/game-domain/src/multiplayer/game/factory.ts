import type { CommandError, SessionPreparationError } from '../errors'
import { err, ok, type Result } from '../../shared/result'
import type { MemberId } from '../room/types'
import { createRound } from './transitions'
import type { GameOpenState, GameSession } from './types'

export interface CreateGameInput {
	gameId: string
	session: GameSession
	participantIds: readonly MemberId[]
	now: number
}
export function createGame(
	input: CreateGameInput,
): Result<GameOpenState, CommandError | SessionPreparationError> {
	if (
		input.session.questionIds.length === 0 ||
		input.session.eligibleIds.length === 0
	) {
		return err({
			code: 'no_eligible_countries',
		})
	}

	for (const id of input.session.questionIds) {
		if (!input.session.eligibleIds.includes(id)) {
			return err({
				code: 'country_not_eligible',
			})
		}
	}

	if (input.participantIds.length === 0) {
		return err({
			code: 'game_has_no_participants',
		})
	}

	if (new Set(input.participantIds).size !== input.participantIds.length) {
		return err({
			code: 'duplicate_game_participant',
		})
	}

	const participantsById = Object.fromEntries(
		input.participantIds.map(id => [id, { id, score: 0, correctCount: 0 }]),
	)

	return ok({
		phase: 'open',
		gameId: input.gameId,
		session: input.session,
		participantsById,
		startedAt: input.now,
		currentRound: createRound(
			input.session.questionIds,
			input.session.config,
			0,
			input.now,
		),
		completedRounds: [],
	})
}
