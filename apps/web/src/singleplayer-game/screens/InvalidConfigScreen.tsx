import { Link } from 'react-router-dom'

export function InvalidConfigScreen(): JSX.Element {
	return (
		<main className='fixed inset-0 grid place-items-center overflow-y-auto px-5 py-8'>
			<section className='w-full max-w-xl rounded-[28px] border border-slate-300 bg-white/94 p-6 shadow-[0_24px_54px_rgba(15,23,42,0.14)]'>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-rose-700'>
					Одиночная игра
				</p>
				<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
					Не удалось открыть игру
				</h1>
				<p className='mt-3 text-sm leading-7 text-slate-600'>
					Проверьте настройки и попробуйте снова.
				</p>
				<div className='mt-6 flex flex-wrap gap-3'>
					<Link
						to='/singleplayer'
						className='rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-600'
					>
						Открыть настройки
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
