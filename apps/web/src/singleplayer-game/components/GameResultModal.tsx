import { Button, SurfacePanel } from '../../shared/ui'

interface GameResultModalProps {
	open: boolean
	score: number
	correctCount: number
	totalCount: number
	onTryAgain: () => void
	onHome: () => void
}

export function GameResultModal({
	open,
	score,
	correctCount,
	totalCount,
	onTryAgain,
	onHome,
}: GameResultModalProps): JSX.Element | null {
	if (!open) {
		return null
	}

	return (
		<div
			className='fixed inset-0 z-40 grid place-items-center bg-slate-900/45 p-5'
			role='dialog'
			aria-modal='true'
		>
			<SurfacePanel
				width='none'
				className='max-w-105 rounded-[20px] bg-white text-center shadow-[0_24px_54px_rgba(15,23,42,0.24)]'
			>
				<h2 className='m-0 text-2xl font-bold text-slate-900'>
					Сессия завершена
				</h2>

				<div className='my-4'>
					<p className='m-0 text-[40px] leading-none font-extrabold text-slate-900'>
						{score}
					</p>
					<p className='mt-1 text-sm text-slate-700'>
						Правильных ответов: {correctCount} / {totalCount}
					</p>
				</div>

				<div className='flex flex-wrap justify-center gap-2.5'>
					<Button
						type='button'
						variant='teal'
						size='sm'
						className='hover:-translate-y-0.5'
						onClick={onTryAgain}
					>
						Сыграть ещё раз
					</Button>
					<Button
						type='button'
						variant='soft'
						size='sm'
						className='hover:-translate-y-0.5'
						onClick={onHome}
					>
						На главную
					</Button>
				</div>
			</SurfacePanel>
		</div>
	)
}
