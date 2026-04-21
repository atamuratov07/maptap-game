import { elapsedSeconds } from '../../shared/time'

const BASE_ANSWER_SCORE = 100
const TIME_PENALTY_PER_SECOND = 5

export function calculateAnswerScore(
	startedAt: number,
	submittedAt: number,
	isCorrect: boolean,
): number {
	if (!isCorrect) {
		return 0
	}

	const secondsElapsed = elapsedSeconds(startedAt, submittedAt)
	const timePenalty = secondsElapsed * TIME_PENALTY_PER_SECOND

	return Math.max(0, BASE_ANSWER_SCORE - timePenalty)
}
