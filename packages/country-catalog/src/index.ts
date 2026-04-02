import type {
	CountryId,
	CountryPool,
	CountryPoolEntry,
} from '@maptap/game-domain'
import playableCountryRegistryJson from '../generated/countries.playable.json'
import countryRegistryJson from '../generated/countries.registry.json'
import type {
	CountryCatalogPayload,
	CountryInfo,
	CountryRegistryPayload,
	PlayableCountryRegistryPayload,
} from './types'

export const countryRegistry = countryRegistryJson as CountryRegistryPayload

export const playableCountryRegistry =
	playableCountryRegistryJson as PlayableCountryRegistryPayload

export function normalizeCountryId(
	value: string | number | null | undefined,
): CountryId | null {
	if (value === null || value === undefined) {
		return null
	}

	const parsed = Number.parseInt(String(value), 10)
	if (Number.isNaN(parsed)) {
		return null
	}

	return parsed.toString().padStart(3, '0')
}

export function buildCountryCatalog(
	payload: PlayableCountryRegistryPayload = playableCountryRegistry,
): CountryCatalogPayload {
	const countriesById = new Map<CountryId, CountryInfo>()

	for (const country of payload.countries) {
		if (!country.playable) {
			continue
		}

		const id = normalizeCountryId(country.id)
		if (!id || countriesById.has(id)) {
			continue
		}

		countriesById.set(id, {
			id,
			name: country.name.trim(),
			nameRu: country.name_ru.trim(),
			capital: country.capital.trim(),
			capitalRu: country.capital_ru.trim(),
			continent: country.continent,
			population: country.population,
			centroidLng: country.centroid_lng,
			centroidLat: country.centroid_lat,
			currency: country.currency.trim(),
			currencyRu: country.currency_ru.trim(),
			flagUrl: country.flag_url,
			playable: true,
			difficulty: country.difficulty,
			independent: country.independent,
			unMember: country.un_member,
		})
	}

	return {
		countriesById,
		countryIds: Array.from(countriesById.keys()),
	}
}

export function toSessionCountryPool(
	countryCatalog: CountryCatalogPayload,
): CountryPool {
	const countriesById: Record<CountryId, CountryPoolEntry> = {}

	for (const id of countryCatalog.countryIds) {
		const country = countryCatalog.countriesById.get(id)
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

export const countryCatalog = buildCountryCatalog()

export const playableCountryPool = toSessionCountryPool(countryCatalog)

export type {
	CountryInfo,
	CountryRegistryPayload,
	CountryCatalogPayload as GameData,
	PlayableCountryRegistryPayload,
	RegistryCountry,
} from './types'
