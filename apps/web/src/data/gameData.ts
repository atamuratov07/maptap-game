import type {
	CountryId,
	CountryPool,
	CountryPoolEntry,
} from '@maptap/game-domain'
import type { CountryInfo, GameData } from './types'

const PLAYABLE_COUNTRY_REGISTRY_URL =
	'/countries-registry/countries.playable.json'

interface RegistryCountry {
	id?: string
	name?: string
	name_ru?: string
	capital?: string
	capital_ru?: string
	continent?: CountryInfo['continent']
	population?: number
	centroid_lng?: number | null
	centroid_lat?: number | null
	currency?: string
	currency_ru?: string
	flag_url?: string
	playable?: boolean
	difficulty?: string
	independent?: boolean
	un_member?: boolean
}

interface PlayableRegistryPayload {
	countries?: RegistryCountry[]
}

export function normalizeCountryId(
	value: string | number | null | undefined,
): string | null {
	if (value === null || value === undefined) {
		return null
	}

	const parsed = Number.parseInt(String(value), 10)
	if (Number.isNaN(parsed)) {
		return null
	}

	return parsed.toString().padStart(3, '0')
}

const GAME_CONTINENTS = [
	'africa',
	'asia',
	'europe',
	'north-america',
	'south-america',
	'oceania',
] as const satisfies readonly CountryInfo['continent'][]

function requireGameContinent(
	value: RegistryCountry['continent'],
	countryId: string,
): CountryInfo['continent'] {
	if (typeof value === 'string' && GAME_CONTINENTS.includes(value)) {
		return value
	}

	throw new Error(
		`Invalid canonical continent "${value ?? ''}" for country ${countryId}`,
	)
}

function normalizeDifficulty(
	value: string | undefined,
): CountryInfo['difficulty'] {
	const normalized = value?.trim().toLowerCase()
	if (
		normalized === 'easy' ||
		normalized === 'medium' ||
		normalized === 'hard'
	) {
		return normalized
	}
	return 'hard'
}

function requireCoordinate(
	value: number | null | undefined,
	countryId: string,
	fieldName: 'centroid_lng' | 'centroid_lat',
): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(
			`У страны ${countryId} некорректное поле ${fieldName} в ${PLAYABLE_COUNTRY_REGISTRY_URL}`,
		)
	}

	return value
}

async function fetchPlayableRegistry(
	signal?: AbortSignal,
): Promise<PlayableRegistryPayload> {
	try {
		const response = await fetch(PLAYABLE_COUNTRY_REGISTRY_URL, { signal })
		if (!response.ok) {
			throw new Error(
				`Не удалось загрузить ${PLAYABLE_COUNTRY_REGISTRY_URL}: HTTP ${response.status}`,
			)
		}

		return (await response.json()) as PlayableRegistryPayload
	} catch (error) {
		if ((error as { name?: string })?.name === 'AbortError') {
			throw error
		}
		throw new Error(
			`Не удалось загрузить реестр игровых стран из ${PLAYABLE_COUNTRY_REGISTRY_URL}`,
		)
	}
}

async function loadCountryRegistry(
	signal?: AbortSignal,
): Promise<Map<string, CountryInfo>> {
	const payload = await fetchPlayableRegistry(signal)
	const countries = payload.countries ?? []
	const countriesInfo = new Map<string, CountryInfo>()

	for (const country of countries) {
		if (!country.playable) {
			continue
		}

		const id = normalizeCountryId(country.id)
		if (!id || countriesInfo.has(id)) {
			continue
		}

		const name = country.name?.trim() || id
		const nameRu = country.name_ru?.trim() || name
		const capital = country.capital?.trim() || 'Неизвестно'
		const capitalRu = country.capital_ru?.trim() || capital
		const currency = country.currency?.trim() || 'Неизвестно'
		const currencyRu = country.currency_ru?.trim() || currency
		const flagUrl = country.flag_url?.trim() || ''
		const centroidLng = requireCoordinate(
			country.centroid_lng,
			id,
			'centroid_lng',
		)
		const centroidLat = requireCoordinate(
			country.centroid_lat,
			id,
			'centroid_lat',
		)

		countriesInfo.set(id, {
			id,
			name,
			nameRu,
			capital,
			capitalRu,
			continent: requireGameContinent(country.continent, id),
			population:
				typeof country.population === 'number' ? country.population : 0,
			centroidLng,
			centroidLat,
			currency,
			currencyRu,
			flagUrl,
			playable: true,
			difficulty: normalizeDifficulty(country.difficulty),
			independent: country.independent === true,
			unMember: country.un_member === true,
		})
	}

	return countriesInfo
}

export async function loadGameData(signal?: AbortSignal): Promise<GameData> {
	const countriesInfoRaw = await loadCountryRegistry(signal)

	const countriesInfo = new Map<string, CountryInfo>()
	const countryIds = Array.from(countriesInfoRaw.keys())

	for (const id of countryIds) {
		const info = countriesInfoRaw.get(id)
		if (info) {
			countriesInfo.set(id, info)
		}
	}

	return {
		countriesInfo,
		countryIds,
	}
}

export function toSessionCountryPool(gameData: GameData): CountryPool {
	const countriesById: Record<CountryId, CountryPoolEntry> = {}
	for (const id of gameData.countryIds) {
		const country = gameData.countriesInfo.get(id)
		if (country) {
			countriesById[id] = {
				difficulty: country.difficulty,
				continent: country.continent,
			}
		}
	}

	return {
		countriesById,
	}
}
