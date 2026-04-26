import { Button, ButtonLink, ScreenShell, SurfacePanel } from '../../shared/ui'

interface RoomErrorScreenProps {
	message: string
	onRetry: () => void
}

export function RoomErrorScreen({
	message,
	onRetry,
}: RoomErrorScreenProps): JSX.Element {
	return (
		<ScreenShell center>
			<SurfacePanel>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-rose-700'>
					Комната
				</p>
				<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
					Не удалось открыть комнату
				</h1>
				<p className='mt-3 text-sm leading-7 text-slate-600'>{message}</p>
				<div className='mt-6 flex flex-wrap gap-3'>
					<Button type='button' onClick={onRetry}>
						Повторить
					</Button>
					<ButtonLink to='/multiplayer' variant='secondary'>
						Мультиплеер
					</ButtonLink>
				</div>
			</SurfacePanel>
		</ScreenShell>
	)
}
