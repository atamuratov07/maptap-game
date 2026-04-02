import type { CountryId, GameContinent, GameDifficulty } from '../shared/types'

export interface CountryPoolEntry {
	difficulty: GameDifficulty
	continent: GameContinent
}

export interface CountryPool {
	countriesById: Readonly<Record<CountryId, CountryPoolEntry>>
}
