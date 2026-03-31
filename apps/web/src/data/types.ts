import type { GameContinent, GameDifficulty } from '../core/types'

export interface CountryInfo {
	id: string
	name: string
	nameRu: string
	capital: string
	capitalRu: string
	continent: GameContinent
	population: number
	centroidLng: number
	centroidLat: number
	currency: string
	currencyRu: string
	playable: boolean
	difficulty: GameDifficulty
	independent: boolean
	unMember: boolean
	flagUrl: string
}

export interface GameData {
	countriesInfo: Map<string, CountryInfo>
	countryIds: string[]
}
