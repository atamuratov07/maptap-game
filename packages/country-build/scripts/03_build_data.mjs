/* This is the core script.

It does all of this:

* loads the original Demotiles z6 country polygons,
* loads current Natural Earth countries and populated places ZIPs,
* fetches REST Countries v3.1 for cca2, cca3, ccn3, capital, capitalInfo, continents, and translations,
* fetches Wikidata for Russian country and capital labels,
* validates your 195 playable roster,
* assigns difficulty,
* builds a countries join CSV keyed by ADM0_A3,
* rebuilds centroids.geojson using original demotiles centroids when possible,
* builds capitals.geojson,
* creates supplemental country polygons only for playable states missing from the base,
* creates the geolines join CSV keyed by name,
* writes validator reports and exits with failure if any required fields are still missing. REST Countries’ current docs require the fields filter on /v3.1/all, and Wikidata’s SPARQL service returns JSON when requested with Accept: application/sparql-results+json.
 */

import pointOnFeature from '@turf/point-on-feature'
import fs from 'node:fs'
import shp from 'shpjs'
import { canonicalizeContinent } from './lib/continent.mjs'
import { fetchWdqsJson } from './lib/wdqs.mjs'

const BASE_COUNTRIES = 'build/base_countries.geojson'
const BASE_CENTROIDS_NDJSON = 'build/base_centroids_z0.geojson'
const NE_COUNTRIES_ZIP = 'upstream/ne_110m_admin_0_countries.zip'
const NE_PLACES_ZIP = 'upstream/ne_110m_populated_places.zip'
const PLAYABLE_JSON = 'data/playable_states_195.json'
const OVERRIDES_JSON = 'data/manual_overrides.json'

fs.mkdirSync('build', { recursive: true })

function readJson(path) {
	return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
	fs.writeFileSync(path, JSON.stringify(value, null, 2), 'utf8')
}

function firstNonEmpty(...vals) {
	for (const v of vals) {
		if (v === undefined || v === null) continue
		if (Array.isArray(v) && v.length === 0) continue
		if (typeof v === 'string' && v.trim() === '') continue
		return v
	}
	return ''
}

function normalizeIsoToken(v) {
	const s = String(v ?? '').trim()
	if (!s || s === '-99') return ''
	return s
}

function firstArrayValue(v) {
	return Array.isArray(v) && v.length ? v[0] : ''
}

function csvEscape(v) {
	if (v === null || v === undefined) return ''
	const s = String(v)
	return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

function writeCsv(path, header, rows) {
	const out = [header.join(',')]
	for (const row of rows) out.push(row.map(csvEscape).join(','))
	fs.writeFileSync(path, out.join('\n'), 'utf8')
}

function normalizeLabelKey(v) {
	if (typeof v !== 'string') return ''
	return v.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
}

function labelPairKey(name, abbrev) {
	return `${name}|${abbrev}`
}

function addToIndex(indexMap, key, value) {
	if (!key) return
	let set = indexMap.get(key)
	if (!set) {
		set = new Set()
		indexMap.set(key, set)
	}
	set.add(value)
}

function readTippecanoeNdjson(path) {
	if (!fs.existsSync(path)) return []
	const text = fs.readFileSync(path, 'utf8').trim()
	if (!text) return []

	const out = []
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim()
		if (!trimmed) continue
		try {
			const feat = JSON.parse(trimmed)
			const coords = feat?.geometry?.coordinates
			if (
				feat?.type === 'Feature' &&
				feat?.geometry?.type === 'Point' &&
				Array.isArray(coords) &&
				coords.length === 2
			) {
				out.push(feat)
			}
		} catch {
			// Keep parsing the rest even if one line is malformed.
		}
	}
	return out
}

async function loadZipAsFeatureCollection(zipPath) {
	const buf = fs.readFileSync(zipPath)
	const parsed = await shp(buf)
	if (parsed?.type === 'FeatureCollection') return parsed
	if (Array.isArray(parsed)) {
		const fc = parsed.find(x => x?.type === 'FeatureCollection')
		if (fc) return fc
	}
	throw new Error(`Could not parse ${zipPath}`)
}

async function fetchJson(url) {
	const res = await fetch(url, {
		headers: { 'user-agent': 'demotiles-hybrid-build/1.0' },
	})
	if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
	return res.json()
}

function validatePlayable(playable) {
	const all = playable.all ?? []
	const easy = new Set(playable.easy ?? [])
	const medium = new Set(playable.medium ?? [])
	const allSet = new Set(all)

	if (all.length !== 195 || allSet.size !== 195) {
		throw new Error(
			'data/playable_states_195.json must contain exactly 195 unique ISO3 codes in `all`',
		)
	}

	for (const code of easy) {
		if (!allSet.has(code))
			throw new Error(`easy contains ${code} which is not in all`)
	}
	for (const code of medium) {
		if (!allSet.has(code))
			throw new Error(`medium contains ${code} which is not in all`)
		if (easy.has(code))
			throw new Error(`Code ${code} appears in both easy and medium`)
	}

	const difficultyByA3 = new Map()
	for (const code of all) {
		if (easy.has(code)) difficultyByA3.set(code, 'easy')
		else if (medium.has(code)) difficultyByA3.set(code, 'medium')
		else difficultyByA3.set(code, 'hard')
	}

	return {
		all,
		allSet,
		easyCount: easy.size,
		mediumCount: medium.size,
		hardCount: all.length - easy.size - medium.size,
		difficultyByA3,
	}
}

function pickNeA3(p) {
	return firstNonEmpty(
		p.ADM0_A3,
		p.ADM0_A3_US,
		p.ADM0_A3_UN,
		p.ISO_A3,
		p.ISO_A3_EH,
		p.SOV_A3,
		p.GU_A3,
		p.SU_A3,
		p.BRK_A3,
	)
}

function pickNeIsoA2(p) {
	return firstNonEmpty(normalizeIsoToken(p.ISO_A2), normalizeIsoToken(p.WB_A2))
}

function pickNeIsoN3(p) {
	return firstNonEmpty(
		normalizeIsoToken(p.ISO_N3),
		normalizeIsoToken(p.UN_A3),
		normalizeIsoToken(p.ADM0_A3_UN),
	)
}

function pickNeName(p) {
	return firstNonEmpty(p.NAME_LONG, p.ADMIN, p.NAME, p.SOVEREIGNT, p.BRK_NAME)
}

function pickNeAbbrev(p) {
	return firstNonEmpty(p.ABBREV, p.BRK_NAME, p.NAME)
}

function pickNeContinent(p) {
	return firstNonEmpty(p.CONTINENT, p.REGION_UN)
}

function pickPlaceA3(p) {
	return firstNonEmpty(p.ADM0_A3, p.SOV_A3, p.SOV0_A3, p.ISO_A3)
}

function isAdmin0Capital(p) {
	return (
		p.FEATURECLA === 'Admin-0 capital' ||
		p.FEATURECLA === 'Admin-0 capital alt'
	)
}

function buildCapitalFallbackMap(placesFc) {
	const map = new Map()

	for (const feat of placesFc.features ?? []) {
		const p = feat.properties ?? {}
		if (!isAdmin0Capital(p)) continue

		const a3 = pickPlaceA3(p)
		if (!a3) continue

		const rank = Number(firstNonEmpty(p.SCALERANK, 999))
		const altPenalty = p.FEATURECLA === 'Admin-0 capital alt' ? 1 : 0
		const score = rank + altPenalty

		const prev = map.get(a3)
		if (!prev || score < prev.score) {
			map.set(a3, {
				score,
				name: firstNonEmpty(p.NAME, p.NAMEASCII, ''),
				coordinates: feat.geometry?.coordinates ?? null,
			})
		}
	}

	return map
}

const playable = validatePlayable(readJson(PLAYABLE_JSON))
const overrides = readJson(OVERRIDES_JSON)
const baseCountries = readJson(BASE_COUNTRIES)
const neCountriesFc = await loadZipAsFeatureCollection(NE_COUNTRIES_ZIP)
const nePlacesFc = await loadZipAsFeatureCollection(NE_PLACES_ZIP)

const restCountries = await fetchJson(
	'https://restcountries.com/v3.1/all?fields=cca2,cca3,ccn3,name,translations,capital,capitalInfo,continents,independent',
)

const wikidata = await fetchWdqsJson({
	cacheKey: 'wdqs-country-capital-labels',
	query: `
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX wikibase: <http://wikiba.se/ontology#>

SELECT ?iso3 ?countryLabel ?capitalLabel WHERE {
  ?country wdt:P298 ?iso3 .
  OPTIONAL { ?country wdt:P36 ?capital . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru,en". }
}
`,
})

const restByA3 = new Map()
for (const row of restCountries) {
	if (row?.cca3) restByA3.set(row.cca3, row)
}

const wdByA3 = new Map()
for (const row of wikidata.results.bindings ?? []) {
	const a3 = row.iso3?.value?.trim()
	if (!a3 || wdByA3.has(a3)) continue
	wdByA3.set(a3, {
		NAME_RU: row.countryLabel?.value?.trim() ?? '',
		CAPITAL_RU: row.capitalLabel?.value?.trim() ?? '',
	})
}

const neByA3 = new Map()
for (const feat of neCountriesFc.features ?? []) {
	const p = feat.properties ?? {}
	const a3 = pickNeA3(p)
	if (a3 && !neByA3.has(a3)) neByA3.set(a3, feat)
}

const capitalFallbackByA3 = buildCapitalFallbackMap(nePlacesFc)

const baseByA3 = new Map()
for (const feat of baseCountries.features ?? []) {
	const p = feat.properties ?? {}
	const a3 = p.ADM0_A3
	if (a3 && !baseByA3.has(a3)) baseByA3.set(a3, feat)
}

const baseCentroidFeatures = readTippecanoeNdjson(BASE_CENTROIDS_NDJSON)
if (baseCentroidFeatures.length === 0) {
	console.warn(
		`No original base centroids found at ${BASE_CENTROIDS_NDJSON}; falling back to pointOnFeature.`,
	)
}

const baseA3ByName = new Map()
const baseA3ByAbbrev = new Map()
const baseA3ByPair = new Map()
for (const [a3, feat] of baseByA3.entries()) {
	const nameKey = normalizeLabelKey(feat.properties?.NAME)
	const abbrevKey = normalizeLabelKey(feat.properties?.ABBREV)
	addToIndex(baseA3ByName, nameKey, a3)
	addToIndex(baseA3ByAbbrev, abbrevKey, a3)
	addToIndex(baseA3ByPair, labelPairKey(nameKey, abbrevKey), a3)
}

function pickSingleCandidate(set) {
	if (!set || set.size !== 1) return ''
	for (const value of set) return value
	return ''
}

const originalCentroidByA3 = new Map()
const centroidMatchStats = {
	source_point_count: baseCentroidFeatures.length,
	matched_source_points: 0,
	ambiguous_source_points: 0,
	unmatched_source_points: 0,
}

for (const feat of baseCentroidFeatures) {
	const p = feat.properties ?? {}
	const nameKey = normalizeLabelKey(p.NAME)
	const abbrevKey = normalizeLabelKey(p.ABBREV)
	const pairKey = labelPairKey(nameKey, abbrevKey)

	let a3 = pickSingleCandidate(baseA3ByPair.get(pairKey))
	if (!a3) a3 = pickSingleCandidate(baseA3ByName.get(nameKey))
	if (!a3) a3 = pickSingleCandidate(baseA3ByAbbrev.get(abbrevKey))

	if (a3) {
		if (!originalCentroidByA3.has(a3)) {
			originalCentroidByA3.set(a3, feat.geometry.coordinates)
		}
		centroidMatchStats.matched_source_points += 1
		continue
	}

	const pairSet = baseA3ByPair.get(pairKey)
	const nameSet = baseA3ByName.get(nameKey)
	const abbrevSet = baseA3ByAbbrev.get(abbrevKey)
	const isAmbiguous =
		(pairSet && pairSet.size > 1) ||
		(!pairSet &&
			((nameSet && nameSet.size > 1) || (abbrevSet && abbrevSet.size > 1)))

	if (isAmbiguous) centroidMatchStats.ambiguous_source_points += 1
	else centroidMatchStats.unmatched_source_points += 1
}

const centroidSourceStats = {
	from_original: 0,
	from_fallback_point_on_feature: 0,
}

function buildCentroidGeometry(a3, props, geometry) {
	const originalCoords = originalCentroidByA3.get(a3)
	if (Array.isArray(originalCoords) && originalCoords.length === 2) {
		centroidSourceStats.from_original += 1
		return {
			type: 'Point',
			coordinates: originalCoords,
		}
	}

	const centroidPoint = pointOnFeature({
		type: 'Feature',
		properties: props,
		geometry,
	})
	centroidSourceStats.from_fallback_point_on_feature += 1
	return centroidPoint.geometry
}

function toSeedRecord(props) {
	return {
		ADM0_A3: String(props.ADM0_A3),
		NAME: String(props.NAME),
		NAME_RU: String(props.NAME_RU),
		CAPITAL: String(props.CAPITAL),
		CAPITAL_RU: String(props.CAPITAL_RU),
		CONTINENT: String(props.CONTINENT),
		ISO_A2: String(props.ISO_A2),
		ISO_N3: String(props.ISO_N3),
		DIFFICULTY: String(props.DIFFICULTY),
		PLAYABLE: Number(props.PLAYABLE) === 1 ? 1 : 0,
	}
}

function buildCountryRecord({ a3, baseFeat, neFeat }) {
	const base = baseFeat?.properties ?? {}
	const ne = neFeat?.properties ?? {}
	const rest = restByA3.get(a3) ?? null
	const wd = wdByA3.get(a3) ?? {}
	const ov = overrides.countries?.[a3] ?? {}
	const capFallback = capitalFallbackByA3.get(a3) ?? null

	const playableFlag = playable.allSet.has(a3) ? 1 : 0
	const difficulty = playable.difficultyByA3.get(a3) ?? 'hard'

	const NAME = firstNonEmpty(
		ov.NAME,
		base.NAME,
		pickNeName(ne),
		rest?.name?.common,
	)

	const ABBREV = firstNonEmpty(ov.ABBREV, base.ABBREV, pickNeAbbrev(ne), NAME)

	const NAME_RU = firstNonEmpty(
		ov.NAME_RU,
		wd.NAME_RU,
		rest?.translations?.rus?.common,
	)

	const CAPITAL = firstNonEmpty(
		ov.CAPITAL,
		firstArrayValue(rest?.capital),
		ne.CAPITAL,
		capFallback?.name,
	)

	const CAPITAL_RU = firstNonEmpty(ov.CAPITAL_RU, wd.CAPITAL_RU)

	let CAPITAL_COORDS = null
	if (Array.isArray(ov.CAPITAL_COORDS) && ov.CAPITAL_COORDS.length === 2) {
		CAPITAL_COORDS = ov.CAPITAL_COORDS
	} else if (
		Array.isArray(rest?.capitalInfo?.latlng) &&
		rest.capitalInfo.latlng.length === 2
	) {
		CAPITAL_COORDS = [
			Number(rest.capitalInfo.latlng[1]),
			Number(rest.capitalInfo.latlng[0]),
		]
	} else if (capFallback?.coordinates) {
		CAPITAL_COORDS = capFallback.coordinates
	}

	const ISO_A2 = firstNonEmpty(ov.ISO_A2, pickNeIsoA2(ne), rest?.cca2)

	const ISO_N3 = firstNonEmpty(ov.ISO_N3, pickNeIsoN3(ne), rest?.ccn3)

	const CONTINENT = canonicalizeContinent(
		firstNonEmpty(
			ov.CONTINENT,
			base.CONTINENT,
			pickNeContinent(ne),
			firstArrayValue(rest?.continents),
		),
		a3,
	)

	const props = {
		NAME,
		NAME_RU,
		CAPITAL,
		CAPITAL_RU,
		ABBREV,
		ADM0_A3: a3,
		ISO_A2,
		ISO_N3,
		CONTINENT,
		DIFFICULTY: difficulty,
		PLAYABLE: playableFlag,
	}

	const missing = []
	for (const key of [
		'NAME',
		'NAME_RU',
		'CAPITAL',
		'CAPITAL_RU',
		'ADM0_A3',
		'ISO_A2',
		'ISO_N3',
		'CONTINENT',
		'DIFFICULTY',
	]) {
		if (!props[key]) missing.push(key)
	}
	if (!CAPITAL_COORDS) missing.push('CAPITAL_COORDS')

	return { props, CAPITAL_COORDS, missing }
}

const joinRows = []
const centroids = []
const capitals = []
const supplementalCountries = []
const countrySeed = []
const validatorFailures = []
const missingPlayableGeometry = []

for (const [a3, baseFeat] of [...baseByA3.entries()].sort()) {
	const neFeat = neByA3.get(a3) ?? null
	const record = buildCountryRecord({ a3, baseFeat, neFeat })

	if (record.missing.length) {
		validatorFailures.push({
			ADM0_A3: a3,
			NAME: baseFeat.properties?.NAME ?? '',
			MISSING: record.missing.join('|'),
		})
	}

	joinRows.push([
		a3,
		record.props.NAME,
		record.props.NAME_RU,
		record.props.CAPITAL,
		record.props.CAPITAL_RU,
		record.props.ISO_A2,
		record.props.ISO_N3,
		record.props.CONTINENT,
		record.props.DIFFICULTY,
		record.props.PLAYABLE,
	])

	countrySeed.push(toSeedRecord(record.props))

	centroids.push({
		type: 'Feature',
		properties: record.props,
		geometry: buildCentroidGeometry(a3, record.props, baseFeat.geometry),
	})

	capitals.push({
		type: 'Feature',
		properties: record.props,
		geometry: {
			type: 'Point',
			coordinates: record.CAPITAL_COORDS ?? [0, 0],
		},
	})
}

const missingPlayableFromBase = playable.all.filter(a3 => !baseByA3.has(a3))

for (const a3 of missingPlayableFromBase) {
	const neFeat = neByA3.get(a3) ?? null
	if (!neFeat) {
		missingPlayableGeometry.push({ ADM0_A3: a3 })
		continue
	}

	const record = buildCountryRecord({ a3, baseFeat: null, neFeat })

	if (record.missing.length) {
		validatorFailures.push({
			ADM0_A3: a3,
			NAME: pickNeName(neFeat.properties ?? {}),
			MISSING: record.missing.join('|'),
		})
	}

	supplementalCountries.push({
		type: 'Feature',
		properties: record.props,
		geometry: neFeat.geometry,
	})

	centroids.push({
		type: 'Feature',
		properties: record.props,
		geometry: buildCentroidGeometry(a3, record.props, neFeat.geometry),
	})

	capitals.push({
		type: 'Feature',
		properties: record.props,
		geometry: {
			type: 'Point',
			coordinates: record.CAPITAL_COORDS ?? [0, 0],
		},
	})
}

const seedByA3 = new Map()

for (const row of countrySeed) {
	seedByA3.set(row.ADM0_A3, row)
}

const countrySeedSorted = [...seedByA3.values()].sort((a, b) =>
	a.ADM0_A3.localeCompare(b.ADM0_A3),
)

writeJson('build/country_seed.json', countrySeedSorted)

writeCsv(
	'build/join_adm0.csv',
	[
		'ADM0_A3',
		'NAME',
		'NAME_RU',
		'CAPITAL',
		'CAPITAL_RU',
		'ISO_A2',
		'ISO_N3',
		'CONTINENT',
		'DIFFICULTY',
		'PLAYABLE',
	],
	joinRows,
)

writeCsv(
	'build/geolines_join.csv',
	['name', 'name_ru'],
	Object.entries(overrides.geolines ?? {}).map(([name, nameRu]) => [
		name,
		nameRu,
	]),
)

writeJson('build/centroids.geojson', {
	type: 'FeatureCollection',
	features: centroids,
})

writeJson('build/capitals.geojson', {
	type: 'FeatureCollection',
	features: capitals,
})

writeJson('build/supplemental_countries.geojson', {
	type: 'FeatureCollection',
	features: supplementalCountries,
})

writeCsv(
	'build/validator_country_failures.csv',
	['ADM0_A3', 'NAME', 'MISSING'],
	validatorFailures.map(r => [r.ADM0_A3, r.NAME, r.MISSING]),
)

writeCsv(
	'build/missing_playable_geometry.csv',
	['ADM0_A3'],
	missingPlayableGeometry.map(r => [r.ADM0_A3]),
)

writeJson('build/centroid_audit.json', {
	source_file: BASE_CENTROIDS_NDJSON,
	...centroidMatchStats,
	mapped_a3_with_original_centroids: originalCentroidByA3.size,
	base_country_count: baseByA3.size,
	...centroidSourceStats,
})

writeJson('build/playable_base_audit.json', {
	playable_count: playable.all.length,
	easy_count: playable.easyCount,
	medium_count: playable.mediumCount,
	hard_count: playable.hardCount,
	base_country_count: baseByA3.size,
	missing_playable_from_base_count: missingPlayableFromBase.length,
	missing_playable_from_base: missingPlayableFromBase,
	supplemental_country_count: supplementalCountries.length,
	validator_failure_count: validatorFailures.length,
	missing_playable_geometry_count: missingPlayableGeometry.length,
})

if (missingPlayableGeometry.length > 0 || validatorFailures.length > 0) {
	console.error('Build blocked.')
	console.error(
		'Inspect build/playable_base_audit.json, build/validator_country_failures.csv, and build/missing_playable_geometry.csv',
	)
	process.exit(1)
}

console.log('OK')
console.log(JSON.stringify(readJson('build/playable_base_audit.json'), null, 2))
