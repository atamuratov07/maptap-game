export type CountryId = string

export const GAME_DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type GameDifficulty = (typeof GAME_DIFFICULTIES)[number]

export const GAME_CONTINENTS = [
	'asia',
	'europe',
	'oceania',
	'north-america',
	'south-america',
	'africa',
] as const
export type GameContinent = (typeof GAME_CONTINENTS)[number]

export const GAME_SCOPES = ['all', ...GAME_CONTINENTS] as const
export type GameScope = (typeof GAME_SCOPES)[number]

export interface GameQuestionSetConfig {
	questionCount: number
	difficulty: GameDifficulty
	scope: GameScope
}
