export type RandomNumberGenerator = () => number

export function pickRandomIds<T>(
	ids: readonly T[],
	count: number,
	rng: RandomNumberGenerator = Math.random,
): T[] {
	if (count <= 0 || ids.length === 0) {
		return []
	}

	const shuffled = [...ids]

	for (let i = shuffled.length - 1; i > 0; i--) {
		const swapIndex = Math.floor(rng() * (i + 1))
		;[shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]]
	}

	return shuffled.slice(0, Math.min(count, shuffled.length))
}
