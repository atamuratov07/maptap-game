import type {
	CountryId,
	GameContinent,
	GameDifficulty,
} from '@georally/game-domain'

export interface RegistryCountry {
	id: CountryId
	name: string
	name_ru: string
	name_uz_latn: string
	capital: string
	capital_ru: string
	capital_uz_latn: string
	continent: GameContinent
	population: number
	centroid_lng: number
	centroid_lat: number
	currency: string
	currency_ru: string
	currency_uz_latn: string
	flag_url: string
	playable: boolean
	difficulty: GameDifficulty
	independent: boolean
	un_member: boolean
}

interface CountryRegistryPayloadBase {
	version: number
	generated_at: string
	countries: RegistryCountry[]
}

export interface CountryRegistryPayload extends CountryRegistryPayloadBase {
	country_count: number
}

export interface PlayableCountryRegistryPayload extends CountryRegistryPayloadBase {
	playable_count: number
}

export interface CountryInfo {
	id: CountryId
	name: string
	nameRu: string
	nameUzLatn: string
	capital: string
	capitalRu: string
	capitalUzLatn: string
	continent: GameContinent
	population: number
	centroidLng: number
	centroidLat: number
	currency: string
	currencyRu: string
	currencyUzLatn: string
	playable: boolean
	difficulty: GameDifficulty
	independent: boolean
	unMember: boolean
	flagUrl: string
}

export interface CountryCatalogPayload {
	countriesById: Map<CountryId, CountryInfo>
	countryIds: CountryId[]
}
