export type GamePhase = 'idle' | 'playing' | 'revealed' | 'finished'

export type GameDifficulty = 'easy' | 'medium' | 'hard'

export interface GameConfig {
	questionCount: number
	attemptsPerQuestion: number
	difficulty: GameDifficulty
}

export interface SessionCountryInfo {
	difficulty: GameDifficulty
}

export interface SessionCountryPool {
	allowedIds: readonly string[]
	countriesById: ReadonlyMap<string, SessionCountryInfo>
}

export interface PreparedGameSession {
	config: GameConfig
	questionIds: string[]
}

export interface GameState {
	phase: GamePhase
	config: GameConfig
	questionIds: string[]
	index: number
	attemptsLeft: number
	wrongPicks: string[]
	revealedId?: string
	score: number
	correctCount: number
	gameStartedAt: number
	questionStartedAt: number
	questionResolvedAt?: number
}

export type GameAction =
	| {
			type: 'START'
			config: GameConfig
			questionIds: string[]
			now: number
	  }
	| {
			type: 'PICK'
			countryId: string
			now: number
	  }
	| {
			type: 'GIVE_UP'
			now: number
	  }
	| {
			type: 'NEXT'
			now: number
	  }
	| {
			type: 'HOME'
	  }
