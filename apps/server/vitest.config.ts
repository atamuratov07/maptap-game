import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		restoreMocks: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html'],
			exclude: ['**/*.test.ts', '**/*.config.ts'],
		},
	},
})
