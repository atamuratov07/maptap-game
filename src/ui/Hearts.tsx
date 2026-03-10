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
		<div
			className='flex items-center gap-2 rounded-full bg-slate-900/75 px-3.5 py-2 shadow-xl backdrop-blur'
			aria-label={`Осталось попыток: ${safeAttempts}`}
		>
			{Array.from({ length: maxAttempts }, (_, index) => {
				const isFilled = index < safeAttempts
				return (
					<span
						key={`heart-${index + 1}`}
						className={`text-[28px] leading-none ${isFilled ? 'text-rose-400' : 'text-slate-400'}`}
					>
						{isFilled ? '\u2665' : '\u2661'}
					</span>
				)
			})}
		</div>
	)
}
