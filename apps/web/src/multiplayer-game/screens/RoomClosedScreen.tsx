import { ButtonLink, ScreenShell, SurfacePanel } from '../../shared/ui'
import { formatClosedReason } from '../model/roomSelectors'

interface RoomClosedScreenProps {
	reason: 'host_terminated' | 'expired' | 'server_shutdown'
}

export function RoomClosedScreen({
	reason,
}: RoomClosedScreenProps): JSX.Element {
	return (
		<ScreenShell center>
			<SurfacePanel>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-rose-700'>
					Комната закрыта
				</p>
				<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
					Игра завершена
				</h1>
				<p className='mt-3 text-sm leading-7 text-slate-600'>
					{formatClosedReason(reason)}
				</p>
				<div className='mt-6 flex flex-wrap gap-3'>
					<ButtonLink to='/multiplayer'>Мультиплеер</ButtonLink>
					<ButtonLink to='/' variant='secondary'>
						На главную
					</ButtonLink>
				</div>
			</SurfacePanel>
		</ScreenShell>
	)
}
