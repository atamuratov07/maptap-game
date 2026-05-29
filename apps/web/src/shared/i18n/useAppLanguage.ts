import { useTranslation } from 'react-i18next'
import { resolveAppLanguage, type AppLanguage } from './locales'

export function useAppLanguage(): AppLanguage {
	const { i18n } = useTranslation()

	return resolveAppLanguage(i18n.resolvedLanguage ?? i18n.language)
}
