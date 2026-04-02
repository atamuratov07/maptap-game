export function elapsedSeconds(start: number, end: number): number {
	return Math.max(0, Math.floor((end - start) / 1000))
}
