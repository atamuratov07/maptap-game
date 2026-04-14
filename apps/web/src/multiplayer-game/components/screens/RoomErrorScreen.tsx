import { Link } from 'react-router'

interface RoomErrorScreenProps {
	message: string
	onRetry: () => void
}

export function RoomErrorScreen({
	message,
	onRetry,
}: RoomErrorScreenProps): JSX.Element {
	return (
		<main className='grid min-h-screen place-items-center px-5 py-8'>
			<section className='w-full max-w-xl rounded-[28px] border border-slate-300 bg-white/94 p-6 shadow-[0_24px_54px_rgba(15,23,42,0.14)]'>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-rose-700'>
					Комната
				</p>
				<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
					Не удалось открыть комнату
				</h1>
				<p className='mt-3 text-sm leading-7 text-slate-600'>{message}</p>
				<div className='mt-6 flex flex-wrap gap-3'>
					<button
						type='button'
						className='rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition hover:bg-amber-400'
						onClick={onRetry}
					>
						Повторить
					</button>
					<Link
						to='/multiplayer'
						className='rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 transition hover:border-slate-400 hover:text-slate-950'
					>
						К мультиплееру
					</Link>
				</div>
			</section>
		</main>
	)
}
