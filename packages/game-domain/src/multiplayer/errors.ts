export type SessionPreparationError =
	| {
			code: 'invalid_game_config'
	  }
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
			code: 'only_host_can_manage_room'
	  }
	| {
			code: 'insufficient_permissions'
	  }
	| {
			code: 'room_not_in_lobby'
	  }
	| {
			code: 'room_not_joinable'
	  }
	| {
			code: 'room_participant_capacity_limit_exceeded'
	  }
	| {
			code: 'room_not_active'
	  }
	| {
			code: 'room_not_finished'
	  }
	| {
			code: 'room_not_in_classroom_mode'
	  }
	| {
			code: 'active_game_not_completed'
	  }
	| {
			code: 'game_not_open'
	  }
	| {
			code: 'game_not_revealed'
	  }
	| {
			code: 'game_not_advanceable'
	  }
	| {
			code: 'game_not_ready_to_complete'
	  }
	| {
			code: 'game_already_completed'
	  }
	| {
			code: 'game_has_no_participants'
	  }
	| {
			code: 'duplicate_game_participant'
	  }
	| {
			code: 'game_participant_not_found'
	  }
	| {
			code: 'game_participant_not_in_room'
	  }
	| {
			code: 'country_not_eligible'
	  }
	| {
			code: 'member_not_found'
	  }
	| {
			code: 'member_name_required'
	  }
	| {
			code: 'member_name_taken'
	  }
	| {
			code: 'member_already_joined'
	  }
	| {
			code: 'member_already_connected'
	  }
	| {
			code: 'participant_already_submitted'
	  }

export type DomainError = SessionPreparationError | CommandError

export function assertNever(value: never, message = 'Unhandled value'): never {
	throw new Error(`${message}: ${JSON.stringify(value)}`)
}
