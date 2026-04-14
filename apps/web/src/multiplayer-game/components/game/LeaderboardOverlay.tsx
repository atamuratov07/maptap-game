import type { RoomLeaderboardEntry } from '@maptap/game-domain/multiplayer'

interface RoomLeaderboardOverlayProps {
	entries: RoomLeaderboardEntry[]
	viewerPlayerId: string
}

export function RoomLeaderboardOverlay({
	entries,
	viewerPlayerId,
}: RoomLeaderboardOverlayProps): JSX.Element | null {
	if (!entries.length) {
		return null
	}

	return (
		<div className='absolute inset-0 z-20 flex items-center justify-center px-4 py-24'>
			<section className='animate-[room-overlay-panel_320ms_ease-out_both] w-full max-w-xl rounded-[32px] border border-white/14 bg-slate-950/84 p-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.48)] backdrop-blur-md sm:p-6'>
				<p className='text-center text-[11px] font-black uppercase tracking-[0.24em] text-slate-300'>
					Лидеры раунда
				</p>
				<h2 className='mt-3 text-center text-3xl font-black tracking-tight'>
					Топ 5
				</h2>

				<div className='mt-6 space-y-3'>
					{entries.map(entry => {
						const isViewer = entry.playerId === viewerPlayerId

						return (
							<div
								key={entry.playerId}
								className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isViewer ? 'border-amber-300/70 bg-amber-400/16' : 'border-white/10 bg-white/6'}`}
							>
								<div className='min-w-0'>
									<p className='truncate text-base font-black'>
										#{entry.rank} {entry.name}
									</p>
									<p className='mt-1 text-sm text-slate-300'>
										Правильных ответов: {entry.correctCount}
									</p>
								</div>
								<p className='text-2xl font-black tracking-tight'>
									{entry.score}
								</p>
							</div>
						)
					})}
				</div>
			</section>
		</div>
	)
}
