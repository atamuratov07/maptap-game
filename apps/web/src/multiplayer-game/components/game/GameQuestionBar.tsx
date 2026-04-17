interface RoomGameHeaderProps {
	progressLabel: string
	questionLabel: string
	targetName: string
	targetFlagUrl?: string
	viewerName: string
	viewerRank?: number | null
	secondsLeft: number | null
}

function formatCountdown(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60

	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function QuestionBarChip({
	label,
	value,
	emphasized = false,
	className,
}: {
	label: string
	value: string
	emphasized?: boolean
	className?: string
}): JSX.Element {
	return (
		<div
			className={`rounded-full px-3 py-2 text-left ${emphasized ? 'bg-amber-400 text-slate-950' : 'bg-white/12 text-slate-100'} ${className ?? ''}`}
		>
			<p className='text-[10px] font-black uppercase tracking-[0.18em] opacity-70'>
				{label}
			</p>
			<p className='text-sm font-black text-inherit tabular-nums'>{value}</p>
		</div>
	)
}

export function GameQuestionBar({
	progressLabel,
	questionLabel,
	targetName,
	targetFlagUrl,
	secondsLeft,
}: RoomGameHeaderProps): JSX.Element {
	return (
		<section className='w-full border-t border-white/12 bg-slate-950/88 px-4 pt-3 pb-8 text-white backdrop-blur-md'>
			<div className='grid w-full max-w-450 grid-cols-1 grid-rows-2 gap-x-3 md:grid-cols-3'>
				<div className='col-start-1 row-start-1 row-span-1 justify-self-start align-center md:row-span-2'>
					<QuestionBarChip
						label='Раунд'
						value={progressLabel}
						className='col-start-1 row-start-1 row-span-1 justify-self-start align-center md:row-span-2'
					/>
				</div>

				<div className='col-start-1 row-start-1 row-span-1 justify-self-center self-center text-center md:col-start-2'>
					<p className='text-[11px] font-black uppercase tracking-[0.22em] text-slate-300'>
						{questionLabel}
					</p>
				</div>
				<div className='row-start-2 col-start-1 col-span-1 flex flex-wrap items-center justify-center gap-2 self-start justify-self-center md:col-start-2'>
					<h1 className='text-2xl font-black tracking-tight text-white sm:text-3xl'>
						{targetName}
					</h1>
					{targetFlagUrl ? (
						<img
							src={targetFlagUrl}
							alt=''
							className='h-5 w-7 rounded-sm border border-white/60 object-cover'
						/>
					) : null}
				</div>
				<div className='row-start-1 row-span-1 col-start-1 justify-self-end align-center md:row-span-2 md:col-start-3'>
					{secondsLeft !== null ? (
						<QuestionBarChip
							label='Время'
							value={formatCountdown(secondsLeft)}
							emphasized
						/>
					) : null}
				</div>
			</div>
		</section>
	)
}
