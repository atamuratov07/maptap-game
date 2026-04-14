import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import './globals.css'
import { StrictMode } from 'react'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<BrowserRouter>
			<App />
		</BrowserRouter>
		,
	</StrictMode>,
)
