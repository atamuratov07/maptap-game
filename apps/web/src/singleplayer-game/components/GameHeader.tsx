import { Link } from 'react-router-dom'
import { QuestionTimer } from './QuestionTimer'

interface GameHeaderBarProps {
	questionIndex: number
	questionCount: number
	targetName: string
	targetFlagUrl?: string
	isPlaying: boolean
	questionStartedAt: number
	questionResolvedAt?: number
	onGiveUp: () => void
}

export function GameHeader({
	questionIndex,
	questionCount,
	targetName,
	targetFlagUrl,
	isPlaying,
	questionStartedAt,
	questionResolvedAt,
	onGiveUp,
}: GameHeaderBarProps): JSX.Element {
	const progressLabel = questionCount
		? `Вопрос ${Math.min(questionIndex + 1, questionCount)} / ${questionCount}`
		: 'Нет вопросов'

	return (
		<header className='flex justify-center border-b border-slate-500/35 bg-slate-950/88  text-white backdrop-blur-md'>
			<div className='relative w-full max-w-300 px-4 py-3'>
				<div className='absolute top-1.5 left-4'>
					<p className='text-[12px] font-semibold uppercase tracking-[0.05em] text-slate-300'>
						{progressLabel}
					</p>
				</div>
				<div className='mx-auto grid items-end gap-1 grid-cols-[auto_1fr_auto] sm:gap-4'>
					<Link
						to='/singleplayer'
						aria-label='Выйти'
						className='inline-flex items-center justify-center rounded-lg  bg-white/90 px-3 py-2 text-sm font-bold text-slate-700 transition  hover:text-slate-950 sm:px-3.5'
					>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='20'
							height='20'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							className='shrink-0 rotate-180 sm:hidden'
							aria-hidden='true'
						>
							<path d='m16 17 5-5-5-5' />
							<path d='M21 12H9' />
							<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
						</svg>
						<span className='hidden sm:inline'>Выйти</span>
					</Link>

					<div className='flex min-w-0 justify-center'>
						<div className='flex flex-col items-center justify-center gap-2 text-center'>
							<span className='text-sm font-semibold text-slate-300'>
								Найди:
							</span>
							<span className='flex flex-wrap items-center justify-center gap-2 text-xl font-bold leading-tight sm:text-2xl'>
								{targetName}
								{targetFlagUrl ? (
									<img
										src={targetFlagUrl}
										alt=''
										className='h-5 w-7 rounded-[3px] border border-slate-100/80 object-cover'
									/>
								) : null}
							</span>
						</div>
					</div>

					<button
						type='button'
						aria-label='Сдаться'
						className='inline-flex items-center justify-center rounded-lg bg-white/20 px-3 py-2 text-sm font-bold text-slate-50 transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-55 sm:px-3.5'
						onClick={onGiveUp}
						disabled={!isPlaying}
					>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='20'
							height='20'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'
							className='shrink-0 sm:hidden'
							aria-hidden='true'
						>
							<path d='M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528' />
						</svg>
						<span className='hidden sm:inline'>Сдаться</span>
					</button>
				</div>
				<div className='absolute top-1 right-4 text-sm font-bold'>
					<QuestionTimer
						isPlaying={isPlaying}
						questionStartedAt={questionStartedAt}
						questionResolvedAt={questionResolvedAt}
					/>
				</div>
			</div>
		</header>
	)
}
