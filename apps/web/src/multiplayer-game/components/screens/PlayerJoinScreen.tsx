import { useState } from 'react'
import { Link } from 'react-router-dom'

interface PlayerJoinScreenProps {
	hostName: string
	joinable: boolean
	pending: boolean
	submitError: string | null
	resumeMessage: string | null
	onJoin: (playerName: string) => Promise<void>
}

export function PlayerJoinScreen({
	hostName,
	joinable,
	pending,
	submitError,
	resumeMessage,
	onJoin,
}: PlayerJoinScreenProps): JSX.Element {
	const [playerName, setPlayerName] = useState('')

	return (
		<main className='fixed inset-0 grid place-items-center overflow-y-auto px-5 py-8'>
			<section className='w-full max-w-3xl rounded-4xl border border-white/60 bg-white/92 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-600'>
							Мультиплеер
						</p>
						<h1 className='mt-3 text-4xl font-black tracking-tight text-slate-950'>
							Присоединиться к игре
						</h1>
						<p className='mt-3 text-sm leading-7 text-slate-600'>
							Хост: {hostName}
						</p>
					</div>
					<Link
						to='/multiplayer'
						className='rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950'
					>
						Назад
					</Link>
				</div>

				{resumeMessage ? (
					<p className='mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800'>
						{resumeMessage}
					</p>
				) : null}

				{submitError ? (
					<p className='mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700'>
						{submitError}
					</p>
				) : null}

				<div className='mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:p-6'>
					<label className='block'>
						<span className='mb-2 block text-sm font-semibold text-slate-800'>
							Имя игрока
						</span>
						<input
							type='text'
							value={playerName}
							onChange={event => {
								setPlayerName(event.target.value)
							}}
							maxLength={20}
							className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
							placeholder='Введите имя'
						/>
					</label>

					<button
						type='button'
						className='mt-5 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60'
						onClick={() => void onJoin(playerName)}
						disabled={
							!joinable || playerName.trim().length === 0 || pending
						}
					>
						{pending ? 'Входим...' : 'Войти'}
					</button>

					{!joinable ? (
						<p className='mt-4 text-sm font-medium text-rose-700'>
							Присоединиться к этой комнате уже нельзя.
						</p>
					) : null}
				</div>
			</section>
		</main>
	)
}
