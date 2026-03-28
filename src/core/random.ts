export type RandomNumberGenerator = () => number

export function pickRandomIds(
	ids: readonly string[],
	count: number,
	rng: RandomNumberGenerator = Math.random,
): string[] {
	if (ids.length === 0 || count <= 0) {
		return []
	}

	const pool = [...ids]
	for (let index = pool.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(rng() * (index + 1))
		;[pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]]
	}

	return pool.slice(0, Math.min(count, pool.length))
}
