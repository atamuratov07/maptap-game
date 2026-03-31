import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const libDir = path.dirname(fileURLToPath(import.meta.url))
const packageRootDir = path.resolve(libDir, '..', '..')

const DEFAULT_REGISTRY_OUT_DIR = path.join(packageRootDir, 'dist')
const DEFAULT_TILES_DIR = path.join(packageRootDir, 'dist', 'tiles')
const DEFAULT_TILES_URL_TEMPLATE = '/map/tiles/{z}/{x}/{y}.pbf'

function readOption(args, optionName) {
	for (let index = 0; index < args.length; index += 1) {
		const current = args[index]
		if (current === optionName) {
			const value = args[index + 1]
			if (!value || value.startsWith('--')) {
				throw new Error(`Missing value for ${optionName}`)
			}
			return value
		}

		const withEqualsPrefix = `${optionName}=`
		if (current.startsWith(withEqualsPrefix)) {
			return current.slice(withEqualsPrefix.length)
		}
	}

	return null
}

function resolveOptionPath(value, fallbackPath) {
	if (!value) {
		return fallbackPath
	}

	return path.resolve(packageRootDir, value)
}

export function resolvePackagePath(...segments) {
	return path.resolve(packageRootDir, ...segments)
}

export function ensureDir(dirPath) {
	fs.mkdirSync(dirPath, { recursive: true })
}

export function parseRegistryOutputOptions(args = process.argv.slice(2)) {
	return {
		outDir: resolveOptionPath(
			readOption(args, '--out-dir'),
			DEFAULT_REGISTRY_OUT_DIR,
		),
	}
}

export function parseTilesOutputOptions(args = process.argv.slice(2)) {
	return {
		tilesDir: resolveOptionPath(
			readOption(args, '--tiles-dir'),
			DEFAULT_TILES_DIR,
		),
		tilesUrlTemplate:
			readOption(args, '--tiles-url-template') ??
			DEFAULT_TILES_URL_TEMPLATE,
	}
}
