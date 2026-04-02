import type { GamePhase } from '@maptap/game-domain/singleplayer'
import { useEffect, useMemo, useState } from 'react'

interface QuestionTimerProps {
	phase: GamePhase
	questionStartedAt: number
	questionResolvedAt?: number
}

export function QuestionTimer({
	phase,
	questionStartedAt,
	questionResolvedAt,
}: QuestionTimerProps): JSX.Element {
	const isPlaying = phase === 'playing'
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (!isPlaying) {
			return
		}

		const intervalId = window.setInterval(() => {
			setNow(Date.now())
		}, 1000)

		return () => {
			window.clearInterval(intervalId)
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
