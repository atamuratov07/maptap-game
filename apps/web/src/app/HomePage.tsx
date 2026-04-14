import { Link } from 'react-router'
import { GameCard } from '../shared/components/GameCard'

export function HomePage(): JSX.Element {
	return (
		<main className='min-h-screen px-5 py-8 sm:px-8 lg:px-10'>
			<div className='mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col rounded-4xl border border-white/60 bg-white/82 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 lg:p-10'>
				<header className='mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
					<div className='max-w-3xl'>
						<p className='mb-4 text-xs font-black uppercase tracking-[0.3em] text-teal-700'>
							MapTap
						</p>
						<h1 className='max-w-2xl text-5xl font-black leading-[0.94] tracking-tight text-slate-950 sm:text-6xl'>
							Изучай карту, играя.
						</h1>
						<p className='mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg'>
							Выбери режим и играй на карте сам или вместе с друзьями.
						</p>
					</div>
				</header>

				<section className='grid flex-1 gap-5 lg:grid-cols-2'>
					<GameCard
						eyebrow='Соло'
						title='Одиночная игра'
						description='Выбери настройки и начни игру.'
						to='/singleplayer'
						ctaLabel='Играть'
						tone='teal'
					/>
					<GameCard
						eyebrow='Онлайн'
						title='Мультиплеер'
						description='Создай комнату или войди по коду.'
						to='/multiplayer'
						ctaLabel='Открыть'
						tone='amber'
					/>
				</section>

				<footer className='mt-10 flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between'>
					<p>Выбери режим и начни игру.</p>
					<Link
						to='/singleplayer'
						className='inline-flex items-center gap-2 font-semibold text-slate-800 transition hover:text-teal-700'
					>
						Начать с одиночной игры
						<span aria-hidden='true'>-&gt;</span>
					</Link>
				</footer>
			</div>
		</main>
	)
}
