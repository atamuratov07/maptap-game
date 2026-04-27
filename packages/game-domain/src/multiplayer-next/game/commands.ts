import type { CommandError } from '../errors'
import { err, ok, type Result } from '../../shared/result'
import type { MemberId } from '../room/types'
import type {
	GameParticipantState,
	GameState,
	GameQuestion,
	LockedSubmission,
	PlayerAnswer,
} from './types'

export type GameCommand = {
	type: 'SUBMIT_ANSWER'
	participantId: MemberId
	answer: PlayerAnswer
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

function getCurrentQuestion(state: GameState): GameQuestion | null {
	if (state.phase === 'completed') {
		return null
	}

	return state.session.questions[state.currentRound.questionIndex] ?? null
}

function isAnswerAllowedForQuestion(
	question: GameQuestion,
	answer: PlayerAnswer,
): boolean {
	switch (question.kind) {
		case 'map_pick_country':
			return (
				answer.kind === 'country_id' &&
				question.eligibleAnswerIds.includes(answer.countryId)
			)

		case 'quiz_choice':
			return (
				answer.kind === 'choice_id' &&
				question.choices.some(choice => choice.id === answer.choiceId)
			)
	}
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

			const question = getCurrentQuestion(state)
			if (!question || !isAnswerAllowedForQuestion(question, command.answer)) {
				return err({
					code: 'answer_not_allowed',
				})
			}

			const submission: LockedSubmission = {
				participantId: command.participantId,
				answer: command.answer,
				countryId:
					command.answer.kind === 'country_id'
						? command.answer.countryId
						: null,
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
