import type { RoomView } from '@maptap/game-domain/multiplayer'
import { Link } from 'react-router-dom'
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
		<main className='fixed inset-0 grid place-items-center overflow-y-auto px-5 py-8'>
			<section className='w-full max-w-2xl rounded-[32px] border border-white/60 bg-white/92 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8'>
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
									className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${isViewer ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}
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
					<Link
						to='/multiplayer'
						className='rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-400'
					>
						К мультиплееру
					</Link>
					<Link
						to='/'
						className='rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:border-slate-400 hover:text-slate-950'
					>
						На главную
					</Link>
				</div>
			</section>
		</main>
	)
}
