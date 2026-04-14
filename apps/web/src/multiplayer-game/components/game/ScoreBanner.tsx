import type { EvaluatedViewerSubmissionState } from '@maptap/game-domain/multiplayer'
import { getSubmissionResultLabel } from '../../core/roomView'

interface RoomScoreBannerProps {
	submission: EvaluatedViewerSubmissionState | null
	viewerScore?: number | null
}

export function RoomScoreBanner({
	submission,
	viewerScore,
}: RoomScoreBannerProps): JSX.Element {
	const scoreAwarded = submission?.scoreAwarded ?? 0
	const scoreLabel = `${scoreAwarded > 0 ? '+' : ''}${scoreAwarded} очков`

	return (
		<div className='absolute inset-x-0 top-24 z-20 flex justify-center px-4'>
			<section className='animate-[room-score-banner_360ms_cubic-bezier(0.22,1,0.36,1)_both] rounded-[28px] border border-white/16 bg-slate-950/82 px-6 py-4 text-center text-white shadow-[0_22px_60px_rgba(15,23,42,0.42)] backdrop-blur-md'>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-slate-300'>
					{getSubmissionResultLabel(submission)}
				</p>
				<p className='mt-2 text-3xl font-black tracking-tight'>{scoreLabel}</p>
				{viewerScore !== null && viewerScore !== undefined ? (
					<p className='mt-1 text-sm font-semibold text-slate-300'>
						Общий счёт: {viewerScore}
					</p>
				) : null}
			</section>
		</div>
	)
}
