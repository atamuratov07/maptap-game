import type { VisiblePlayerInfo } from '@maptap/game-domain/multiplayer'
import { UserRound } from 'lucide-react'
import { useMemo } from 'react'
import { AlertMessage, Button, CopyButton } from '../../../shared/ui'
import { cn } from '../../../shared/utils'

interface RoomLobbyScreenProps {
	role: 'host' | 'player'
	roomCode: string
	players: VisiblePlayerInfo[]
	startPending?: boolean
	actionErrorMessage?: string | null
	isReconnecting?: boolean
	onStartGame?: () => void
}

function InvitePanel({ roomCode }: { roomCode: string }): JSX.Element {
	const inviteUrl = useMemo(() => {
		if (typeof window === 'undefined') {
			return `/multiplayer/room/${roomCode}`
		}

		return new URL(
			`/multiplayer/room/${roomCode}`,
			location.origin,
		).toString()
	}, [roomCode])

	return (
		<section
			aria-label='Приглашение в игру'
			className='mx-auto mt-6 flex w-full max-w-2xl flex-col items-center gap-4 rounded-[28px] border border-white/70 bg-white/90 px-5 py-4 shadow-[0_18px_54px_rgba(15,23,42,0.12)] backdrop-blur sm:flex-row sm:justify-between'
		>
			<div className='text-center sm:text-left'>
				<p className='text-[10px] font-black uppercase tracking-[0.22em] text-slate-500'>
					Код комнаты
				</p>
				<p className='mt-1 font-mono text-3xl font-black tracking-[0.2em] text-slate-950'>
					{roomCode}
				</p>
			</div>

			<div className='flex flex-wrap justify-center gap-2'>
				<CopyButton
					textToCopy={roomCode}
					title='Скопировать код комнаты'
					className='min-h-11 border-slate-200 py-2.5 shadow-sm hover:-translate-y-0.5 hover:border-amber-300'
				>
					Код
				</CopyButton>
				<CopyButton
					textToCopy={inviteUrl}
					title='Скопировать ссылку на комнату'
					className='min-h-11 border-slate-200 py-2.5 shadow-sm hover:-translate-y-0.5 hover:border-amber-300'
				>
					Ссылка
				</CopyButton>
			</div>
		</section>
	)
}

function PlayerTile({ player }: { player: VisiblePlayerInfo }): JSX.Element {
	return (
		<li className='flex min-w-0 flex-col items-center gap-3 text-center'>
			<div
				className={cn(
					'grid h-20 w-20 place-items-center rounded-full border-2 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.12)] sm:h-24 sm:w-24',
					player.connected
						? 'border-amber-300'
						: 'border-slate-200 opacity-55',
				)}
			>
				<UserRound
					aria-hidden='true'
					size={42}
					strokeWidth={2}
					className='text-slate-700'
				/>
			</div>
			<span className='block w-full truncate px-1 text-sm font-black text-slate-950 sm:text-base'>
				{player.name}
			</span>
		</li>
	)
}

export function RoomLobbyScreen({
	role,
	roomCode,
	players,
	startPending = false,
	actionErrorMessage = null,
	isReconnecting = false,
	onStartGame,
}: RoomLobbyScreenProps): JSX.Element {
	const isHost = role === 'host'

	return (
		<main className='fixed inset-0 flex flex-col overflow-hidden px-5 py-6 text-slate-950 sm:px-8'>
			<header className='relative z-10 mx-auto w-full max-w-6xl text-center'>
				<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-600'>
					Лобби
				</p>
				<h1 className='mt-3 text-4xl font-black tracking-tight sm:text-5xl'>
					{isHost ? 'Подготовка к игре' : 'Ждём старт'}
				</h1>
				<p className='mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600'>
					{isHost
						? 'Когда все готовы, запускайте игру. После старта комната перейдёт в полноэкранный игровой режим.'
						: 'Хост скоро начнёт игру. Карта откроется сразу в полноэкранном режиме.'}
				</p>

				{isReconnecting ? (
					<AlertMessage className='mx-auto mt-5 max-w-xl'>
						Переподключаемся к комнате...
					</AlertMessage>
				) : null}

				{actionErrorMessage ? (
					<AlertMessage tone='error' className='mx-auto mt-5 max-w-xl'>
						{actionErrorMessage}
					</AlertMessage>
				) : null}

				<InvitePanel roomCode={roomCode} />
			</header>

			<section
				aria-label='Игроки в комнате'
				className='relative z-0 flex min-h-0 flex-1 items-start justify-center overflow-y-auto py-10 pb-36'
			>
				<ul className='grid w-full max-w-6xl grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
					{players.map(player => (
						<PlayerTile key={player.playerId} player={player} />
					))}
				</ul>
			</section>

			<footer className='fixed inset-x-0 bottom-10 z-20 flex justify-center px-5 sm:bottom-12'>
				{isHost ? (
					<Button
						type='button'
						size='lg'
						className='shadow-[0_14px_36px_rgba(245,158,11,0.28)]'
						onClick={onStartGame}
						disabled={startPending}
					>
						{startPending ? 'Запуск...' : 'Начать игру'}
					</Button>
				) : (
					<p className='rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-sm font-black text-slate-700 shadow-[0_14px_36px_rgba(15,23,42,0.14)]'>
						Ждём, когда хост начнёт игру
					</p>
				)}
			</footer>
		</main>
	)
}
