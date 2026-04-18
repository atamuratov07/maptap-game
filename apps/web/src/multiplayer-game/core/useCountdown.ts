import { useEffect, useState } from 'react'

export function useCountdown(deadlineAt: number | null): number {
	const [now, setNow] = useState(() => Date.now())

	useEffect(() => {
		if (!deadlineAt) {
			return
		}

		setNow(Date.now())
		const intervalId = setInterval(() => {
			setNow(Date.now())
		}, 1000)

		return () => {
			clearInterval(intervalId)
		}
	}, [deadlineAt])

	if (!deadlineAt) {
		return 0
	}

	return Math.max(0, Math.ceil((deadlineAt - now) / 1000))
}
