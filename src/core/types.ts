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

export interface IdleGameState {
	phase: 'idle'
	config: GameConfig
}

interface StartedGameStateBase {
	config: GameConfig
	questionIds: string[]
	index: number
	score: number
	correctCount: number
	questionStartedAt: number
}

export interface PlayingGameState extends StartedGameStateBase {
	phase: 'playing'
	attemptsLeft: number
	wrongPicks: string[]
}

export interface RevealedGameState extends StartedGameStateBase {
	phase: 'revealed'
	attemptsLeft: number
	wrongPicks: string[]
	revealedId: string
	questionResolvedAt: number
}

export interface FinishedGameState extends StartedGameStateBase {
	phase: 'finished'
	questionResolvedAt: number
}

export type StartedGameState =
	| PlayingGameState
	| RevealedGameState
	| FinishedGameState

export type GameState = IdleGameState | StartedGameState

export type GameAction =
	| {
			type: 'START'
			session: PreparedGameSession
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
