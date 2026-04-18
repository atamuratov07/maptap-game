import type { RoomView } from '@maptap/game-domain/multiplayer'
import { ButtonLink, ScreenShell, SurfacePanel } from '../../../shared/ui'
import { cn } from '../../../shared/utils'
import { getLeaderboard, getViewerLeaderboardEntry } from '../../core/roomView'

interface RoomFinishedScreenProps {
	room: RoomView
	isReconnecting: boolean
}

export function RoomFinishedScreen({
	room,
	isReconnecting,
}: RoomFinishedScreenProps): JSX.Element {
	const viewerEntry = getViewerLeaderboardEntry(room)
	const topEntries = getLeaderboard(room)

	return (
		<ScreenShell center>
			<SurfacePanel
				width='lg'
				className='rounded-[32px] border-white/60 bg-white/92 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8'
			>
				<p className='text-center text-[11px] font-black uppercase tracking-[0.24em] text-slate-500'>
					Завершено
				</p>
				<h1 className='mt-3 text-center text-4xl font-black tracking-tight text-slate-950'>
					Игра окончена
				</h1>
				{viewerEntry ? (
					<p className='mt-4 text-center text-sm font-semibold text-slate-600'>
						Ваш результат: #{viewerEntry.rank} • {viewerEntry.score} очков
					</p>
				) : null}
				{isReconnecting ? (
					<p className='mt-4 text-center text-sm font-medium text-slate-600'>
						Переподключение всё ещё выполняется.
					</p>
				) : null}

				{topEntries.length ? (
					<div className='mt-8 space-y-3'>
						{topEntries.map(entry => {
							const isViewer = entry.playerId === room.viewerPlayerId

							return (
								<div
									key={entry.playerId}
									className={cn(
										'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3',
										isViewer
											? 'border-amber-300 bg-amber-50'
											: 'border-slate-200 bg-slate-50',
									)}
								>
									<div className='min-w-0'>
										<p className='truncate text-base font-black text-slate-950'>
											#{entry.rank} {entry.name}
										</p>
										<p className='mt-1 text-sm text-slate-600'>
											Правильных ответов: {entry.correctCount}
										</p>
									</div>
									<p className='text-2xl font-black tracking-tight text-slate-950'>
										{entry.score}
									</p>
								</div>
							)
						})}
					</div>
				) : null}

				<div className='mt-8 flex flex-wrap justify-center gap-3'>
					<ButtonLink
						to='/multiplayer'
					>
						К мультиплееру
					</ButtonLink>
					<ButtonLink
						to='/'
						variant='secondary'
					>
						На главную
					</ButtonLink>
				</div>
			</SurfacePanel>
		</ScreenShell>
	)
}
