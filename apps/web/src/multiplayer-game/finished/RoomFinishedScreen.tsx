import type { RoomFinishedView } from '@maptap/game-domain/multiplayer-next/room'
import { DoorClosed, RotateCcw } from 'lucide-react'
import {
	AlertMessage,
	Button,
	ButtonLink,
	ScreenShell,
	SurfacePanel,
} from '../../shared/ui'
import { getLeaderboardEntries } from '../model/gameSelectors'
import { ResultsList } from './ResultsList'

interface RoomFinishedScreenCapabilities {
	canPlayAgain: boolean
	canTerminateRoom: boolean
	canLeaveRoom: boolean
}

interface RoomFinishedScreenProps {
	room: RoomFinishedView
	capabilities: RoomFinishedScreenCapabilities
	isReconnecting: boolean
	playAgainPending?: boolean
	terminatePending?: boolean
	actionErrorMessage?: string | null
	onPlayAgain?: () => void
	onTerminateRoom?: () => void
}

export function RoomFinishedScreen({
	room,
	capabilities,
	isReconnecting,
	playAgainPending = false,
	terminatePending = false,
	actionErrorMessage = null,
	onPlayAgain,
	onTerminateRoom,
}: RoomFinishedScreenProps): JSX.Element {
	const viewerEntry = room.viewerLeaderboardEntry
	const leaderboardEntries = getLeaderboardEntries(
		room.lastGameResult,
		room.members,
		5,
	)

	return (
		<ScreenShell center>
			<SurfacePanel
				width='lg'
				className='rounded-4xl border-white/60 bg-white/92 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8'
			>
				<p className='text-center text-[11px] font-black uppercase tracking-[0.24em] text-slate-500'>
					Финал
				</p>
				<h1 className='mt-3 text-center text-4xl font-black tracking-tight text-slate-950'>
					Игра завершена
				</h1>

				{viewerEntry ? (
					<p className='mt-4 text-center text-sm font-semibold text-slate-600'>
						Ваш результат: #{viewerEntry.rank} / {viewerEntry.score} очков
					</p>
				) : null}

				{isReconnecting ? (
					<p className='mt-4 text-center text-sm font-medium text-slate-600'>
						Переподключаемся к комнате...
					</p>
				) : null}

				{actionErrorMessage ? (
					<AlertMessage tone='error' className='mt-5'>
						{actionErrorMessage}
					</AlertMessage>
				) : null}

				<ResultsList
					entries={leaderboardEntries}
					viewerMemberId={room.viewerMemberId}
				/>

				<div className='mt-8 flex flex-wrap justify-center gap-3'>
					{capabilities.canPlayAgain && onPlayAgain ? (
						<Button
							type='button'
							is3d
							disabled={playAgainPending}
							onClick={onPlayAgain}
						>
							<RotateCcw
								aria-hidden='true'
								size={16}
								strokeWidth={2.4}
							/>
							{playAgainPending ? 'Возвращаемся...' : 'Сыграть ещё'}
						</Button>
					) : null}
					{capabilities.canTerminateRoom && onTerminateRoom ? (
						<Button
							type='button'
							variant='danger'
							is3d
							disabled={terminatePending}
							onClick={onTerminateRoom}
						>
							<DoorClosed
								aria-hidden='true'
								size={16}
								strokeWidth={2.4}
							/>
							{terminatePending ? 'Закрываем...' : 'Закрыть комнату'}
						</Button>
					) : null}
					{capabilities.canLeaveRoom ? (
						<>
							<ButtonLink is3d to='/multiplayer'>
								Мультиплеер
							</ButtonLink>
							<ButtonLink is3d to='/' variant='secondary'>
								На главную
							</ButtonLink>
						</>
					) : null}
				</div>
			</SurfacePanel>
		</ScreenShell>
	)
}
