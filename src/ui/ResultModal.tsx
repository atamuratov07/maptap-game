interface ResultModalProps {
	open: boolean
	score: number
	correctCount: number
	totalCount: number
	onTryAgain: () => void
	onHome: () => void
}

export function ResultModal({
	open,
	score,
	correctCount,
	totalCount,
	onTryAgain,
	onHome,
}: ResultModalProps): JSX.Element | null {
	if (!open) {
		return null
	}

	return (
		<div className='result-modal-backdrop' role='dialog' aria-modal='true'>
			<section className='result-modal'>
				<h2>Игра завершена</h2>
				<div className='result-stats'>
					<p className='result-score'>{score}</p>
					<p className='result-detail'>
						Верно: {correctCount} / {totalCount}
					</p>
				</div>

				<div className='result-actions'>
					<button
						type='button'
						className='primary-button'
						onClick={onTryAgain}
					>
						Сыграть снова
					</button>
					<button
						type='button'
						className='secondary-button'
						onClick={onHome}
					>
						На главную
					</button>
				</div>
			</section>
		</div>
	)
}
