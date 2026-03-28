export type GameLoadErrorCode = 'load_failed' | 'no_playable_countries'

export type GameSessionErrorCode = 'no_eligible_countries'

export type GameErrorCode = GameLoadErrorCode | GameSessionErrorCode

export interface GameSessionError {
	code: GameSessionErrorCode
}
