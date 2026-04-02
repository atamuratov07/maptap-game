export type CountryId = string

export type GameDifficulty = 'easy' | 'medium' | 'hard'

export type GameContinent =
	| 'asia'
	| 'europe'
	| 'oceania'
	| 'north-america'
	| 'south-america'
	| 'africa'

export type GameScope = 'all' | GameContinent

export interface GameQuestionSetConfig {
	questionCount: number
	difficulty: GameDifficulty
	scope: GameScope
}
