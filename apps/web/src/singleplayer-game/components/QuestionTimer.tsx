import { useEffect, useMemo, useState } from 'react'

interface QuestionTimerProps {
	isPlaying: boolean
	questionStartedAt: number
	questionResolvedAt: number | null
}

export function QuestionTimer({
	isPlaying,
	questionStartedAt,
	questionResolvedAt,
}: QuestionTimerProps): JSX.Element {
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (!isPlaying) {
			return
		}

		const intervalId = setInterval(() => {
			setNow(Date.now())
		}, 1000)

		return () => {
			clearInterval(intervalId)
		}
	}, [isPlaying, questionStartedAt])

	const elapsedSeconds = useMemo(() => {
		if (questionStartedAt <= 0) {
			return 0
		}

		const endTime = isPlaying ? now : (questionResolvedAt ?? now)
		return Math.max(0, Math.floor((endTime - questionStartedAt) / 1000))
	}, [isPlaying, now, questionResolvedAt, questionStartedAt])

	return <span>Время: {elapsedSeconds}с</span>
}
