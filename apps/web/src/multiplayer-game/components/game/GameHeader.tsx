interface RoomGameHeaderProps {
	progressLabel: string
	targetLabel: string
	targetName: string
	targetFlagUrl?: string
	viewerName: string
	viewerScore?: number | null
	viewerRank?: number | null
	secondsLeft: number | null
}

function HeaderChip({
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
			<p className='mt-1 text-sm font-black text-inherit'>{value}</p>
		</div>
	)
}

export function GameHeader({
	progressLabel,
	targetLabel,
	targetName,
	targetFlagUrl,
	viewerName,
	viewerScore,
	viewerRank,
	secondsLeft,
}: RoomGameHeaderProps): JSX.Element {
	return (
		<header className='w-full border-b border-white/12 bg-slate-950/88 px-4 py-3 text-white backdrop-blur-md'>
			<div className='relative mx-auto flex max-w-450 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
				<div className='flex flex-wrap items-center gap-2'>
					<HeaderChip label='Раунд' value={progressLabel} />
					<HeaderChip label='Игрок' value={viewerName} />
					{viewerScore !== null && viewerScore !== undefined ? (
						<HeaderChip label='Счёт' value={String(viewerScore)} />
					) : null}
					{viewerRank !== null && viewerRank !== undefined ? (
						<HeaderChip label='Место' value={`#${viewerRank}`} />
					) : null}
				</div>

				<div className='min-w-0 flex-1 text-center'>
					<p className='text-[11px] font-black uppercase tracking-[0.22em] text-slate-300'>
						{targetLabel}
					</p>
					<div className='mt-2 flex flex-wrap items-center justify-center gap-2'>
						<h1 className='text-2xl font-black tracking-tight text-white sm:text-3xl'>
							{targetName}
						</h1>
						{targetFlagUrl ? (
							<img
								src={targetFlagUrl}
								alt=''
								className='h-5 w-7 rounded-[4px] border border-white/60 object-cover'
							/>
						) : null}
					</div>

					{secondsLeft !== null ? (
						<HeaderChip
							label='Время'
							value={`${secondsLeft}с`}
							emphasized
							className='absolute right-0 top-0'
						/>
					) : null}
				</div>
			</div>
		</header>
	)
}
