import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import {
	APP_LANGUAGES,
	DEFAULT_LANGUAGE,
	LANGUAGE_STORAGE_KEY,
	normalizeAppLanguage,
} from './locales'
import { resources } from './resources'

if (!i18n.isInitialized) {
	void i18n
		.use(LanguageDetector)
		.use(initReactI18next)
		.init({
			resources,
			fallbackLng: DEFAULT_LANGUAGE,
			supportedLngs: [...APP_LANGUAGES],
			interpolation: {
				escapeValue: false,
			},
			detection: {
				order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
				lookupQuerystring: 'lang',
				lookupLocalStorage: LANGUAGE_STORAGE_KEY,
				caches: ['localStorage'],
				convertDetectedLanguage: language =>
					normalizeAppLanguage(language) ?? DEFAULT_LANGUAGE,
			},
		})
}

export { i18n }
