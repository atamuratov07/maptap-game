import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '../shared/i18n/setup'
import { I18nDocumentSync } from '../shared/i18n'
import App from './App.tsx'
import '@fontsource-variable/rubik'
import './globals.css'
import { StrictMode } from 'react'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<I18nDocumentSync>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</I18nDocumentSync>
		,
	</StrictMode>,
)
