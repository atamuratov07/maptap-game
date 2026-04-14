import express from 'express'

export interface CreateAppOptions {
	getHealthSnapshot?: () => Record<string, unknown>
}

export function createApp(options: CreateAppOptions = {}) {
	const app = express()

	app.disable('x-powered-by')
	app.use(express.json())

	app.get('/health', (_request, response) => {
		response.json({
			status: 'ok',
			service: 'maptap-server',
			timestamp: Date.now(),
			...options.getHealthSnapshot?.(),
		})
	})

	return app
}
