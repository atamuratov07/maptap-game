export type GamePhase = 'idle' | 'playing' | 'revealed' | 'finished'

export type RendererKind = 'svg' | 'mapbox'

export interface GameConfig {
	questionCount: number
	rendererKind: RendererKind
	attemptsPerQuestion: number
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
