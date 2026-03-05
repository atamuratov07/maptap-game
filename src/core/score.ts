export function calculateQuestionScore(
	secondsElapsed: number,
	wrongPickCount: number,
): number {
	const totalPenalty = secondsElapsed * 5 + wrongPickCount * 20
	return Math.max(0, 100 - totalPenalty)
}
