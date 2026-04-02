export type SessionPreparationError =
	| {
			code: 'no_eligible_countries'
	  }
	| {
			code: 'insufficient_eligible_countries'
			questionCount: number
			countryCount: number
	  }

export type CommandError =
	| {
			code: 'only_host_can_start'
	  }
	| {
			code: 'room_not_in_lobby'
	  }
	| {
			code: 'room_not_joinable'
	  }
	| {
			code: 'room_not_in_question_open'
	  }
	| {
			code: 'room_not_in_question_revealed'
	  }
	| {
			code: 'room_not_on_leaderboard'
	  }
	| {
			code: 'room_already_finished'
	  }
	| {
			code: 'player_not_found'
	  }
	| {
			code: 'player_name_required'
	  }
	| {
			code: 'player_name_taken'
	  }
	| {
			code: 'player_already_joined'
	  }
	| {
			code: 'player_already_connected'
	  }
	| {
			code: 'player_not_connected'
	  }
	| {
			code: 'player_already_submitted'
	  }

export type DomainError = SessionPreparationError | CommandError

export function assertNever(value: never, message = 'Unhandled value'): never {
	throw new Error(`${message}: ${JSON.stringify(value)}`)
}
