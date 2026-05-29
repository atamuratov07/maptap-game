export type RandomNumberGenerator = () => number

export function shuffleValues<T>(
	values: readonly T[],
	rng: RandomNumberGenerator = Math.random,
): T[] {
	const shuffled = [...values]

	for (let i = shuffled.length - 1; i > 0; i--) {
		const swapIndex = Math.floor(rng() * (i + 1))
		;[shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]]
	}

	return shuffled
}

export function pickRandomIds<T>(
	ids: readonly T[],
	count: number,
	rng: RandomNumberGenerator = Math.random,
): T[] {
	if (count <= 0 || ids.length === 0) {
		return []
	}

	return shuffleValues(ids, rng).slice(0, Math.min(count, ids.length))
}
