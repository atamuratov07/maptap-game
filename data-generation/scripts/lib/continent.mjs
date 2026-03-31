function normalizeContinentKey(v) {
	return String(v ?? '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ')
}

export const GAME_CONTINENTS = new Set([
	'africa',
	'asia',
	'europe',
	'north-america',
	'south-america',
	'oceania',
])

const CONTINENT_ALIASES = new Map([
	['africa', 'africa'],
	['asia', 'asia'],
	['europe', 'europe'],
	['north america', 'north-america'],
	['south america', 'south-america'],
	['oceania', 'oceania'],
	['antarctica', 'antarctica'],
])

const CONTINENT_OVERRIDES_BY_A3 = new Map([
	['ATF', 'antarctica'],
	['CLP', 'north-america'],
	['HMD', 'antarctica'],
	['IOT', 'asia'],
	['MDV', 'asia'],
	['MUS', 'africa'],
	['SGS', 'south-america'],
	['SHN', 'africa'],
	['SYC', 'africa'],
])

export function canonicalizeContinent(rawValue, a3) {
	const direct = CONTINENT_ALIASES.get(normalizeContinentKey(rawValue))
	if (direct) {
		return direct
	}

	const override = CONTINENT_OVERRIDES_BY_A3.get(a3)
	if (override) {
		return override
	}

	throw new Error(`Unsupported continent "${rawValue}" for ${a3}`)
}

export function isGameContinent(value) {
	return GAME_CONTINENTS.has(value)
}
