import type { Feature, Geometry } from 'geojson'

export type CountryFeature = Feature<Geometry, Record<string, unknown>> & {
	id: string
}

export type CountryDifficulty = 'easy' | 'medium' | 'hard'

export interface CountryInfo {
	id: string
	name: string
	nameRu: string
	capital: string
	capitalRu: string
	continent: string
	population: number
	centroidLng: number
	centroidLat: number
	currency: string
	currencyRu: string
	playable: boolean
	difficulty: CountryDifficulty
	independent: boolean
	unMember: boolean
	flagUrl: string
}

export interface GameData {
	features: CountryFeature[]
	infoMap: Map<string, CountryInfo>
	allowedIds: string[]
}
