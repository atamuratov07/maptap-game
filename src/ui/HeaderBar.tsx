import type { GamePhase } from '../core/types'
import { QuestionTimer } from './QuestionTimer'

interface HeaderBarProps {
	progressLabel: string
	targetName: string
	targetFlagUrl?: string
	phase: GamePhase
	questionStartedAt: number
	questionResolvedAt?: number
	canGiveUp: boolean
	onGiveUp: () => void
}

export function HeaderBar({
	progressLabel,
	targetName,
	targetFlagUrl,
	phase,
	questionStartedAt,
	questionResolvedAt,
	canGiveUp,
	onGiveUp,
}: HeaderBarProps): JSX.Element {
	return (
		<header className='fixed inset-x-0 top-0 z-30 border-b border-slate-500/35 bg-slate-950/95 px-4 py-3 text-slate-50 backdrop-blur'>
			<div className='mx-auto grid max-w-450 grid-cols-1 items-center gap-2 sm:grid-cols-[120px_1fr_auto] sm:gap-4'>
				<div className='min-w-0'>
					<p className='text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-300'>
						{progressLabel}
					</p>
				</div>

				<div className='flex min-w-0 justify-center'>
					<div className='flex flex-wrap items-center justify-center gap-2 text-center'>
						<span className='text-sm font-semibold text-slate-300'>
							Найдите:
						</span>
						<span className='text-xl font-bold leading-tight sm:text-2xl'>
							{targetName}
						</span>
						{targetFlagUrl ? (
							<img
								src={targetFlagUrl}
								alt=''
								className='h-4.5 w-6.5 rounded-[3px] border border-slate-100/80 object-cover'
							/>
						) : null}
					</div>
				</div>

				<div className='flex items-center justify-center gap-2 sm:justify-end'>
					<div className='min-w-23.5 rounded-full bg-white/15 px-2.5 py-2 text-center text-sm font-bold'>
						<QuestionTimer
							phase={phase}
							questionStartedAt={questionStartedAt}
							questionResolvedAt={questionResolvedAt}
						/>
					</div>
					<button
						type='button'
						className='rounded-lg bg-white/20 px-3.5 py-2 text-sm font-bold text-slate-50 transition hover:-translate-y-0.5 hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-55'
						onClick={onGiveUp}
						disabled={!canGiveUp}
					>
						Сдаться
					</button>
				</div>
			</div>
		</header>
	)
}
