import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	outDir: 'dist',
	clean: true,
	noExternal: [
		'@georally/country-catalog',
		'@georally/game-domain',
		'@georally/game-protocol',
	],
})
