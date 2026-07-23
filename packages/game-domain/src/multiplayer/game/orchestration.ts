import { err, ok, type Result } from '../../shared/result'
import type { CommandError } from '../errors'
import { applyGameCommand, type GameCommand } from './commands'
import type { GameState } from './types'

export interface GameAdvanceContext {
	now: number
}

export function advanceGameRound(
	state: GameState,
	context: GameAdvanceContext,
): Result<GameState, CommandError> {
	if (state.phase !== 'leaderboard') {
		return err({
			code: 'game_not_on_leaderboard',
		})
	}

	const nextQuestionIndex = state.currentRound.questionIndex + 1

	let command: GameCommand
	if (nextQuestionIndex < state.session.questionIds.length) {
		command = {
			type: 'ADVANCE_ROUND',
			now: context.now,
		}
	} else {
		command = {
			type: 'COMPLETE_GAME',
			now: context.now,
		}
	}

	const commandResult = applyGameCommand(state, command)

	if (!commandResult.ok) {
		return err(commandResult.error)
	}

	return ok(commandResult.value)
}

export function advanceGame(
	state: GameState,
	context: GameAdvanceContext,
): Result<GameState, CommandError> {
	switch (state.phase) {
		case 'open': {
			if (!state.session.config.questionDurationMs) {
				return ok(state)
			}

			return applyGameCommand(state, {
				type: 'REVEAL_ROUND',
				now: context.now,
			})
		}

		case 'revealed': {
			return applyGameCommand(state, {
				type: 'SHOW_LEADERBOARD',
				now: context.now,
			})
		}

		case 'leaderboard': {
			const nextQuestionIndex = state.currentRound.questionIndex + 1

			let command: GameCommand

			if (nextQuestionIndex < state.session.questionIds.length) {
				command = {
					type: 'ADVANCE_ROUND',
					now: context.now,
				}
			} else {
				command = {
					type: 'COMPLETE_GAME',
					now: context.now,
				}
			}

			const commandResult = applyGameCommand(state, command)

			if (!commandResult.ok) {
				return err(commandResult.error)
			}

			return ok(commandResult.value)
		}

		case 'completed': {
			return ok(state)
		}
	}
}
