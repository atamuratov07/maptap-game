import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../shared/i18n'
import { ScreenShell, SurfacePanel } from '../shared/ui'
import { GameCard } from '../shared/widgets/GameCard'

export function HomePage(): JSX.Element {
	const { t } = useTranslation()

	return (
		<ScreenShell className='sm:px-8 lg:px-10'>
			<SurfacePanel
				width='none'
				className='mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col rounded-4xl border-white/60 bg-white/82 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8 lg:p-10'
			>
				<header className='mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
					<div className='max-w-3xl'>
						<p className='mb-4 text-xs font-black uppercase tracking-[0.3em] text-teal-700'>
							{t('app.name')}
						</p>
						<h1 className='max-w-2xl text-5xl font-black leading-[0.94] tracking-tight text-slate-950 sm:text-6xl'>
							{t('home.title')}
						</h1>
						<p className='mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg'>
							{t('home.description')}
						</p>
					</div>
					<LanguageSwitcher />
				</header>

				<section className='grid flex-1 gap-5 lg:grid-cols-2'>
					<GameCard
						eyebrow={t('home.singleplayer.eyebrow')}
						title={t('home.singleplayer.title')}
						description={t('home.singleplayer.description')}
						to='/singleplayer'
						ctaLabel={t('home.singleplayer.cta')}
						tone='teal'
					/>
					<GameCard
						eyebrow={t('home.multiplayer.eyebrow')}
						title={t('home.multiplayer.title')}
						description={t('home.multiplayer.description')}
						to='/multiplayer'
						ctaLabel={t('home.multiplayer.cta')}
						tone='amber'
					/>
				</section>

				<footer className='mt-10 flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between'>
					<p>{t('home.footer')}</p>
					<Link
						to='/singleplayer'
						className='inline-flex items-center gap-2 font-semibold text-slate-800 transition hover:text-teal-700'
					>
						{t('home.startSingleplayer')}
						<span aria-hidden='true'>-&gt;</span>
					</Link>
				</footer>
			</SurfacePanel>
		</ScreenShell>
	)
}
