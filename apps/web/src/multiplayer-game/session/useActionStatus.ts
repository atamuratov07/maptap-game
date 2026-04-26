import { useCallback, useState } from 'react'
import { formatGatewayErrorMessage } from '../api/errors'

export function useActionStatus<TAction extends string>() {
	const [actionPending, setActionPending] = useState<TAction | null>(null)
	const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
		null,
	)

	const clearActionError = useCallback(() => {
		setActionErrorMessage(null)
	}, [])

	const runAction = useCallback(
		async (action: TAction, task: () => Promise<void>): Promise<void> => {
			setActionPending(action)
			setActionErrorMessage(null)

			try {
				await task()
			} catch (error) {
				setActionErrorMessage(formatGatewayErrorMessage(error))
			} finally {
				setActionPending(null)
			}
		},
		[],
	)

	return {
		actionPending,
		actionErrorMessage,
		clearActionError,
		runAction,
	}
}
