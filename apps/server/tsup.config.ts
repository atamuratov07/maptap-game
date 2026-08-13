import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	outDir: 'dist',
	clean: true,
	noExternal: [
		'@maptap/country-catalog',
		'@maptap/game-domain',
		'@maptap/game-protocol',
	],
})
