import { ButtonLink, ScreenShell, SurfacePanel } from '../../shared/ui'

export function InvalidConfigScreen(): JSX.Element {
	return (
		<ScreenShell center>
			<SurfacePanel>
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
					<ButtonLink
						to='/singleplayer'
						variant='teal'
					>
						Открыть настройки
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
