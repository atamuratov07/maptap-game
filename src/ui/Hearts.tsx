interface HeartsProps {
	attemptsLeft: number
	maxAttempts: number
}

export function Hearts({
	attemptsLeft,
	maxAttempts,
}: HeartsProps): JSX.Element {
	const safeAttempts = Math.max(0, Math.min(attemptsLeft, maxAttempts))

	return (
		<div className='hearts' aria-label={`Осталось попыток: ${safeAttempts}`}>
			{Array.from({ length: maxAttempts }, (_, index) => {
				const isFilled = index < safeAttempts
				return (
					<span
						key={`heart-${index + 1}`}
						className={`heart ${isFilled ? 'full' : 'empty'}`}
					>
						{isFilled ? '\u2665' : '\u2661'}
					</span>
				)
			})}
		</div>
	)
}
