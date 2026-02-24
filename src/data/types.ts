import type { Feature, Geometry } from 'geojson'

export type CountryFeature = Feature<Geometry, Record<string, unknown>> & {
	id: string
}

export interface CountryInfo {
	id: string
	name: string
	capital: string
	currency: string
	flagUrl: string
}

export interface GameData {
	features: CountryFeature[]
	infoMap: Map<string, CountryInfo>
	allowedIds: string[]
}
