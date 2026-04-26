import { useEffect, useState } from 'react'

export function useTimestampGate(
	startedAt: number | null,
	delayMs: number,
): boolean {
	const [isReady, setIsReady] = useState(() => {
		return startedAt !== null && Date.now() - startedAt >= delayMs
	})

	useEffect(() => {
		if (startedAt === null) {
			setIsReady(false)
			return
		}

		const remainingMs = delayMs - (Date.now() - startedAt)
		if (remainingMs <= 0) {
			setIsReady(true)
			return
		}

		setIsReady(false)
		const timeoutId = setTimeout(() => {
			setIsReady(true)
		}, remainingMs)

		return () => {
			clearTimeout(timeoutId)
		}
	}, [delayMs, startedAt])

	return isReady
}
