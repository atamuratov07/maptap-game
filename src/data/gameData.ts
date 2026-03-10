import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import countriesTopoJsonUrl from 'world-atlas/countries-110m.json?url'
import type { CountryFeature, CountryInfo, GameData } from './types'

const PLAYABLE_COUNTRY_REGISTRY_URL =
	'/countries-registry/countries.playable.json'

interface RegistryCountry {
	id?: string
	name?: string
	name_ru?: string
	capital?: string
	capital_ru?: string
	continent?: string
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

function parseMapFeatures(topologyPayload: unknown): CountryFeature[] {
	const topology = topologyPayload as {
		objects?: Record<string, unknown>
	}

	const countriesObject = topology.objects?.countries
	if (!countriesObject) {
		throw new Error(
			'Не удалось найти геометрию стран в данных world-atlas.',
		)
	}

	const resolvedFeature = feature(
		topologyPayload as never,
		countriesObject as never,
	) as
		| FeatureCollection<Geometry, Record<string, unknown>>
		| Feature<Geometry, Record<string, unknown>>

	const collection: FeatureCollection<
		Geometry,
		Record<string, unknown>
	> = resolvedFeature.type === 'FeatureCollection'
		? resolvedFeature
		: {
				type: 'FeatureCollection',
				features: [resolvedFeature],
			}

	const features: CountryFeature[] = []
	for (const item of collection.features) {
		const normalizedId = normalizeCountryId(
			item.id as string | number | undefined,
		)
		if (!normalizedId) {
			continue
		}

		features.push({
			...item,
			id: normalizedId,
		})
	}

	return features
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
	const infoMap = new Map<string, CountryInfo>()

	for (const country of countries) {
		if (!country.playable) {
			continue
		}

		const id = normalizeCountryId(country.id)
		if (!id || infoMap.has(id)) {
			continue
		}

		const name = country.name?.trim() || id
		const nameRu = country.name_ru?.trim() || name
		const capital = country.capital?.trim() || 'Неизвестно'
		const capitalRu = country.capital_ru?.trim() || capital
		const currency = country.currency?.trim() || 'Неизвестно'
		const currencyRu = country.currency_ru?.trim() || currency
		const flagUrl = country.flag_url?.trim() || ''
		const centroidLng = requireCoordinate(country.centroid_lng, id, 'centroid_lng')
		const centroidLat = requireCoordinate(country.centroid_lat, id, 'centroid_lat')

		infoMap.set(id, {
			id,
			name,
			nameRu,
			capital,
			capitalRu,
			continent: country.continent?.trim() || 'Неизвестно',
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

	return infoMap
}

export async function loadGameData(signal?: AbortSignal): Promise<GameData> {
	const [topologyResponse, infoMapRaw] = await Promise.all([
		fetch(countriesTopoJsonUrl, { signal }),
		loadCountryRegistry(signal),
	])

	if (!topologyResponse.ok) {
		throw new Error(
			`Не удалось загрузить данные world-atlas: ${topologyResponse.status}`,
		)
	}

	const topologyPayload = await topologyResponse.json()
	const topoFeatures = parseMapFeatures(topologyPayload)
	const featureIdSet = new Set(topoFeatures.map(item => item.id))

	const allowedIds = [...infoMapRaw.keys()].filter(id => featureIdSet.has(id))
	const allowedIdSet = new Set(allowedIds)

	const features = topoFeatures.filter(item => allowedIdSet.has(item.id))
	const infoMap = new Map<string, CountryInfo>()

	for (const id of allowedIds) {
		const info = infoMapRaw.get(id)
		if (info) {
			infoMap.set(id, info)
		}
	}

	return {
		features,
		infoMap,
		allowedIds,
	}
}
