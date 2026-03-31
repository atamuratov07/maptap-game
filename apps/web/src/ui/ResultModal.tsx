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
		<div
			className='fixed inset-0 z-40 grid place-items-center bg-slate-900/45 p-5'
			role='dialog'
			aria-modal='true'
		>
			<section className='w-full max-w-[420px] rounded-[18px] border border-slate-300 bg-white p-6 text-center shadow-[0_24px_54px_rgba(15,23,42,0.24)]'>
				<h2 className='m-0 text-2xl font-bold text-slate-900'>Игра завершена</h2>

				<div className='my-4'>
					<p className='m-0 text-[40px] leading-none font-extrabold text-slate-900'>
						{score}
					</p>
					<p className='mt-1 text-sm text-slate-700'>
						Верно: {correctCount} / {totalCount}
					</p>
				</div>

				<div className='flex flex-wrap justify-center gap-2.5'>
					<button
						type='button'
						className='rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow transition hover:-translate-y-0.5 hover:bg-teal-600'
						onClick={onTryAgain}
					>
						Сыграть снова
					</button>
					<button
						type='button'
						className='rounded-lg bg-slate-200 px-4 py-2 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-300'
						onClick={onHome}
					>
						На главную
					</button>
				</div>
			</section>
		</div>
	)
}
