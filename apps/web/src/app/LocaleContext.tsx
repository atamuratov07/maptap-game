import { createContext, useContext } from 'react'
import type { AppLanguage } from '../shared/i18n/locales'

const LocaleContext = createContext<AppLanguage | null>(null)

export const LocaleProvider = LocaleContext.Provider

export function useCurrentLocale(): AppLanguage {
	const locale = useContext(LocaleContext)
	if (!locale) {
		throw new Error('useCurrentLocale() used outside a LocaleProvider')
	}
	return locale
}
