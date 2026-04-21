import type { CommandError } from '../errors'
import { err, ok, type Result } from '../../shared/result'
import type { CountryId } from '../../shared/types'
import type { MemberId } from '../room/types'
import type {
	GameParticipantState,
	GameState,
	LockedSubmission,
} from './types'

export type GameCommand = {
	type: 'SUBMIT_ANSWER'
	participantId: MemberId
	countryId: CountryId
	now: number
}

function requireParticipant(
	state: GameState,
	participantId: MemberId,
): Result<GameParticipantState, CommandError> {
	const participant = state.participantsById[participantId]

	return participant
		? ok(participant)
		: err({ code: 'game_participant_not_found' })
}

export function applyGameCommand(
	state: GameState,
	command: GameCommand,
): Result<GameState, CommandError> {
	switch (command.type) {
		case 'SUBMIT_ANSWER': {
			if (state.phase !== 'open') {
				return err({
					code: 'game_not_open',
				})
			}

			const participantResult = requireParticipant(
				state,
				command.participantId,
			)
			if (!participantResult.ok) {
				return participantResult
			}

			if (state.currentRound.submissions[command.participantId]) {
				return err({
					code: 'participant_already_submitted',
				})
			}

			if (!state.session.eligibleIds.includes(command.countryId)) {
				return err({
					code: 'country_not_eligible',
				})
			}

			const submission: LockedSubmission = {
				participantId: command.participantId,
				countryId: command.countryId,
				submittedAt: command.now,
			}

			return ok({
				...state,
				currentRound: {
					...state.currentRound,
					submissions: {
						...state.currentRound.submissions,
						[command.participantId]: submission,
					},
				},
			})
		}
	}
}
