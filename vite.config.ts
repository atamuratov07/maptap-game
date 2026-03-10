import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function pbfHeaders(): Plugin {
	const isTilePbf = (urlPath: string) =>
		urlPath.endsWith('.pbf') && urlPath.includes('/map/tiles/')
	const isFontPbf = (urlPath: string) =>
		urlPath.endsWith('.pbf') && urlPath.includes('/map/fonts/')

	const applyHeaders = (req: any, res: any, next: () => void) => {
		const urlPath = req.url?.split('?')[0] ?? ''

		if (isTilePbf(urlPath)) {
			// tippecanoe export is gzip-compressed; MapLibre needs this header.
			res.setHeader('Content-Encoding', 'gzip')
			res.setHeader('Content-Type', 'application/x-protobuf')
			res.setHeader('Cache-Control', 'no-store')
		} else if (isFontPbf(urlPath)) {
			res.removeHeader('Content-Encoding')
			res.setHeader('Content-Type', 'application/x-protobuf')
			res.setHeader('Cache-Control', 'no-store')
		}
		next()
	}

	return {
		name: 'pbf-headers',
		configureServer(server) {
			server.middlewares.use(applyHeaders)
		},
		configurePreviewServer(server) {
			server.middlewares.use(applyHeaders)
		},
	}
}

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss(), pbfHeaders()],
	base: '/',
})
