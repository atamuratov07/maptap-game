export const APP_LANGUAGES = ['ru', 'en', 'uz-Latn'] as const

export type AppLanguage = (typeof APP_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: AppLanguage = 'uz-Latn'
export const LANGUAGE_STORAGE_KEY = 'georally.language'

export const APP_LANGUAGE_OPTIONS: Array<{
	value: AppLanguage
	label: string
	shortLabel: string
}> = [
	{ value: 'ru', label: 'Русский', shortLabel: 'RU' },
	{ value: 'en', label: 'English', shortLabel: 'EN' },
	{ value: 'uz-Latn', label: "O'zbekcha", shortLabel: 'UZ' },
]

export function isAppLanguage(value: string): value is AppLanguage {
	return APP_LANGUAGES.includes(value as AppLanguage)
}

export function normalizeAppLanguage(
	value: string | null | undefined,
): AppLanguage | null {
	if (!value) {
		return null
	}

	const normalized = value.trim().replaceAll('_', '-')
	const lowerValue = normalized.toLowerCase()

	if (lowerValue === 'ru' || lowerValue.startsWith('ru-')) {
		return 'ru'
	}

	if (lowerValue === 'en' || lowerValue.startsWith('en-')) {
		return 'en'
	}

	if (lowerValue === 'uz' || lowerValue.startsWith('uz-')) {
		return 'uz-Latn'
	}

	return isAppLanguage(normalized) ? normalized : null
}

export function resolveAppLanguage(
	value: string | null | undefined,
): AppLanguage {
	return normalizeAppLanguage(value) ?? DEFAULT_LANGUAGE
}

export function toFormattingLocale(language: AppLanguage): string {
	switch (language) {
		case 'en':
			return 'en-US'
		case 'ru':
			return 'ru-RU'
		case 'uz-Latn':
			return 'uz-latn-UZ'
	}
}
