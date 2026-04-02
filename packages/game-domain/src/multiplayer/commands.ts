import type { CountryId } from '../shared/types'
import type { PlayerId } from './types'

export type GameCommand =
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
			type: 'REVEAL_QUESTION'
			now: number
	  }
	| {
			type: 'SHOW_LEADERBOARD'
			now: number
	  }
	| {
			type: 'ADVANCE_TO_NEXT_QUESTION'
			now: number
	  }
	| {
			type: 'TERMINATE_GAME'
			now: number
	  }
