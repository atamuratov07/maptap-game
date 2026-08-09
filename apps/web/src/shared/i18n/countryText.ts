import type { CountryInfo } from '@maptap/country-catalog'
import type { AppLanguage } from './locales'

function firstText(...values: Array<string | null | undefined>): string {
	for (const value of values) {
		const normalized = value?.trim()
		if (normalized) {
			return normalized
		}
	}

	return ''
}

export function getCountryName(
	info: CountryInfo,
	language: AppLanguage,
): string {
	switch (language) {
		case 'ru':
			return firstText(info.nameRu, info.name)
		case 'uz-latn':
			return firstText(info.nameUzLatn, info.name, info.nameRu)
		case 'en':
			return firstText(info.name, info.nameRu)
	}
}

export function getCountryCapital(
	info: CountryInfo,
	language: AppLanguage,
): string {
	switch (language) {
		case 'ru':
			return firstText(info.capitalRu, info.capital)
		case 'uz-latn':
			return firstText(info.capitalUzLatn, info.capital, info.capitalRu)
		case 'en':
			return firstText(info.capital, info.capitalRu)
	}
}

export function getCountryCurrency(
	info: CountryInfo,
	language: AppLanguage,
): string {
	switch (language) {
		case 'ru':
			return firstText(info.currencyRu, info.currency)
		case 'uz-latn':
			return firstText(info.currencyUzLatn, info.currency, info.currencyRu)
		case 'en':
			return firstText(info.currency, info.currencyRu)
	}
}
