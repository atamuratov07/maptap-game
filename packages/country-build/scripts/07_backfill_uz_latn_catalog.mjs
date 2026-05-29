import fs from 'node:fs'
import {
	firstUzLatnLabel,
	transliterateCyrillicToUzLatn,
} from './lib/uz-latn.mjs'

const GENERATED_FILES = [
	'../../country-catalog/generated/countries.registry.json',
	'../../country-catalog/generated/countries.playable.json',
]

function readJson(path) {
	return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function writeJson(path, value) {
	fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function chunk(values, size) {
	const chunks = []
	for (let index = 0; index < values.length; index += size) {
		chunks.push(values.slice(index, index + size))
	}
	return chunks
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWdqs(query, attempt = 1) {
	const url = new URL('https://query.wikidata.org/sparql')
	url.searchParams.set('query', query)
	url.searchParams.set('format', 'json')

	const response = await fetch(url, {
		headers: {
			accept: 'application/sparql-results+json',
			'user-agent': 'MapTap country catalog i18n backfill',
		},
	})

	if (!response.ok) {
		if ((response.status === 429 || response.status >= 500) && attempt < 4) {
			await sleep(1000 * attempt)
			return fetchWdqs(query, attempt + 1)
		}
		throw new Error(`Wikidata request failed: ${response.status}`)
	}

	return response.json()
}

async function fetchCountryLabels(ids) {
	const labelsById = new Map()

	for (const idChunk of chunk(ids, 25)) {
		const values = idChunk.map(id => `"${id}"`).join(' ')
		const query = `
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX bd: <http://www.bigdata.com/rdf#>
PREFIX wikibase: <http://wikiba.se/ontology#>

SELECT ?numeric ?countryLabel ?capitalLabel ?currencyLabel WHERE {
  VALUES ?numeric { ${values} }
  ?country wdt:P299 ?numeric .
  OPTIONAL { ?country wdt:P36 ?capital . }
  OPTIONAL { ?country wdt:P38 ?currency . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "uz,en". }
}
`
		const payload = await fetchWdqs(query)

		for (const row of payload.results?.bindings ?? []) {
			const id = row.numeric?.value?.trim()
			if (!id || labelsById.has(id)) {
				continue
			}

			labelsById.set(id, {
				name: firstUzLatnLabel(row.countryLabel?.value),
				capital: firstUzLatnLabel(row.capitalLabel?.value),
				currency: firstUzLatnLabel(row.currencyLabel?.value),
			})
		}
	}

	return labelsById
}

function localizeCountry(country, labels) {
	return {
		...country,
		name_uz_latn: firstUzLatnLabel(
			labels?.name,
			transliterateCyrillicToUzLatn(country.name_ru),
			country.name,
		),
		capital_uz_latn: firstUzLatnLabel(
			labels?.capital,
			transliterateCyrillicToUzLatn(country.capital_ru),
			country.capital,
		),
		currency_uz_latn: firstUzLatnLabel(
			labels?.currency,
			transliterateCyrillicToUzLatn(country.currency_ru),
			country.currency,
		),
	}
}

const registryPath = new URL(GENERATED_FILES[0], import.meta.url)
const registry = readJson(registryPath)
const ids = [...new Set(registry.countries.map(country => country.id))].sort()
const labelsById = await fetchCountryLabels(ids)

for (const relativePath of GENERATED_FILES) {
	const url = new URL(relativePath, import.meta.url)
	const payload = readJson(url)
	payload.countries = payload.countries.map(country =>
		localizeCountry(country, labelsById.get(country.id)),
	)
	writeJson(url, payload)
	console.log(`Backfilled Uzbek Latin labels in ${url.pathname}`)
}
