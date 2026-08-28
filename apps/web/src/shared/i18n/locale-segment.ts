import type { To } from 'react-router-dom'
import type { AppLanguage } from './locales'
import { APP_LANGUAGES } from './locales'

const LOCALE_SEGMENTS: Record<AppLanguage, string> = {
	en: 'en',
	ru: 'ru',
	'uz-Latn': 'uz',
}

const LANGUAGE_BY_SEGMENT: Record<string, AppLanguage> = Object.fromEntries(
	APP_LANGUAGES.map(language => [LOCALE_SEGMENTS[language], language]),
)

export function toLocaleSegment(language: AppLanguage): string {
	return LOCALE_SEGMENTS[language]
}

export function fromLocaleSegment(
	segment: string | undefined,
): AppLanguage | undefined {
	if (!segment) return undefined
	return LANGUAGE_BY_SEGMENT[segment.toLowerCase()]
}

export function prefixWithLocale(to: To, segment: string): To {
	if (typeof to === 'string') {
		return to.startsWith('/') ? `/${segment}${to}` : to
	}
	if (!to.pathname?.startsWith('/')) return to
	return { ...to, pathname: `/${segment}${to.pathname}` }
}
