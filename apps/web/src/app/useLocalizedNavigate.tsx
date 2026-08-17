import { useCallback } from 'react'
import { useNavigate, type NavigateOptions, type To } from 'react-router-dom'
import type { AppLanguage } from '../shared/i18n/locales'
import {
	prefixWithLocale,
	toLocaleSegment,
} from '../shared/i18n/locale-segment'
import { useCurrentLocale } from './LocaleContext'

interface LocalizedNavigateOptions extends NavigateOptions {
	locale?: AppLanguage
}

export function useLocalizedNavigate() {
	const navigate = useNavigate()
	const currentLocale = useCurrentLocale()

	return useCallback(
		(to: To | number, options?: LocalizedNavigateOptions) => {
			if (typeof to === 'number') {
				navigate(to)
				return
			}
			const segment = toLocaleSegment(options?.locale ?? currentLocale)
			navigate(prefixWithLocale(to, segment), options)
		},
		[navigate, currentLocale],
	)
}
