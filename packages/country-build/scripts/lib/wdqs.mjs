import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const WDQS_ENDPOINT = 'https://query.wikidata.org/sparql'
const WDQS_MAX_RETRIES = 3
const WDQS_USER_AGENT =
	'MapTapCountryBuildBot/1.0 https://github.com/atamuratov07/maptap-game'

const helperDir = path.dirname(fileURLToPath(import.meta.url))
const defaultCacheDir = path.resolve(helperDir, '../../build/cache')

function ensureCacheDir(cacheDir) {
	fs.mkdirSync(cacheDir, { recursive: true })
}

function sanitizeCacheKey(cacheKey) {
	const sanitized = String(cacheKey ?? '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/^-+|-+$/g, '')

	if (!sanitized) {
		throw new Error('WDQS cache key must contain at least one safe character')
	}

	return sanitized
}

function buildCachePath(cacheDir, cacheKey) {
	return path.join(cacheDir, `${sanitizeCacheKey(cacheKey)}.json`)
}

function readCachedJson(cachePath) {
	if (!fs.existsSync(cachePath)) {
		return null
	}

	return JSON.parse(fs.readFileSync(cachePath, 'utf8'))
}

function writeCachedJson(cachePath, value) {
	fs.writeFileSync(cachePath, JSON.stringify(value, null, 2), 'utf8')
}

function parseRetryAfterMs(rawValue) {
	if (!rawValue) {
		return null
	}

	const seconds = Number(rawValue)
	if (Number.isFinite(seconds) && seconds >= 0) {
		return Math.round(seconds * 1000)
	}

	const retryAt = Date.parse(rawValue)
	if (Number.isNaN(retryAt)) {
		return null
	}

	return Math.max(0, retryAt - Date.now())
}

function backoffMs(attempt) {
	return Math.min(5000, 1000 * 2 ** attempt)
}

function sleep(ms) {
	return new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}

function formatFailureMessage({ status, statusText, attempts, cachePath }) {
	const statusPart = statusText ? `${status} ${statusText}` : String(status)
	return [
		`WDQS request failed with HTTP ${statusPart} after ${attempts} attempt${attempts === 1 ? '' : 's'}.`,
		`No cached response exists at ${cachePath}.`,
		'The first successful online run is required to seed the local WDQS cache.',
	].join(' ')
}

export async function fetchWdqsJson({
	query,
	cacheKey,
	endpoint = WDQS_ENDPOINT,
	maxRetries = WDQS_MAX_RETRIES,
	userAgent = WDQS_USER_AGENT,
	cacheDir = defaultCacheDir,
}) {
	ensureCacheDir(cacheDir)

	const cachePath = buildCachePath(cacheDir, cacheKey)
	let lastFailure = null
	let attemptsMade = 0

	for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
		attemptsMade = attempt + 1
		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'content-type':
						'application/x-www-form-urlencoded; charset=UTF-8',
					accept: 'application/sparql-results+json',
					'user-agent': userAgent,
				},
				body: new URLSearchParams({ query }),
			})

			if (response.ok) {
				let payload
				try {
					payload = await response.json()
				} catch (error) {
					throw new Error(
						`WDQS returned an invalid JSON body for cache key "${cacheKey}": ${error instanceof Error ? error.message : String(error)}`,
					)
				}

				if (!payload || typeof payload !== 'object') {
					throw new Error(
						`WDQS returned an empty or non-object JSON payload for cache key "${cacheKey}".`,
					)
				}

				writeCachedJson(cachePath, payload)
				return payload
			}

			const failure = {
				status: response.status,
				statusText: response.statusText,
			}
			lastFailure = failure

			if (response.status === 429 && attempt < maxRetries) {
				const retryAfterMs =
					parseRetryAfterMs(response.headers.get('retry-after')) ??
					backoffMs(attempt)
				console.warn(
					`WDQS throttled request "${cacheKey}" with HTTP 429. Retrying in ${retryAfterMs}ms (${attempt + 1}/${maxRetries + 1}).`,
				)
				await sleep(retryAfterMs)
				continue
			}

			break
		} catch (error) {
			lastFailure = {
				status: 'network-error',
				statusText:
					error instanceof Error && error.message
						? error.message
						: String(error),
			}
			break
		}
	}

	const cached = readCachedJson(cachePath)
	if (cached !== null) {
		const statusPart = lastFailure
			? `${lastFailure.status}${lastFailure.statusText ? ` ${lastFailure.statusText}` : ''}`
			: 'unknown error'
		console.warn(
			`WDQS request "${cacheKey}" failed (${statusPart}). Falling back to cached response at ${cachePath}.`,
		)
		return cached
	}

	if (!lastFailure) {
		throw new Error(
			`WDQS request "${cacheKey}" failed before any response was recorded. No cached response exists at ${cachePath}. The first successful online run is required to seed the local WDQS cache.`,
		)
	}

	if (typeof lastFailure.status === 'number') {
		throw new Error(
			formatFailureMessage({
				status: lastFailure.status,
				statusText: lastFailure.statusText,
				attempts: attemptsMade,
				cachePath,
			}),
		)
	}

	throw new Error(
		`WDQS request "${cacheKey}" failed (${lastFailure.statusText}). No cached response exists at ${cachePath}. The first successful online run is required to seed the local WDQS cache.`,
	)
}

export { WDQS_USER_AGENT }
