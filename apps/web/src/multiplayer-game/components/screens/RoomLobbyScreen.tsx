import type { VisiblePlayerInfo } from '@maptap/game-domain/multiplayer'

interface RoomLobbyScreenProps {
	role: 'host' | 'player'
	players: VisiblePlayerInfo[]
	startPending?: boolean
	actionErrorMessage?: string | null
	isReconnecting?: boolean
	onStartGame?: () => void
}

function PlayerTile({ player }: { player: VisiblePlayerInfo }): JSX.Element {
	return (
		<li className='flex min-w-0 flex-col items-center gap-3 text-center'>
			<div
				className={`grid h-20 w-20 place-items-center rounded-full border-2 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.12)] sm:h-24 sm:w-24 ${player.connected ? 'border-amber-300' : 'border-slate-200 opacity-55'}`}
			>
				<svg
					xmlns='http://www.w3.org/2000/svg'
					width='42'
					height='42'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
					aria-hidden='true'
					className='text-slate-700'
				>
					<path d='M20 21a8 8 0 0 0-16 0' />
					<circle cx='12' cy='7' r='4' />
				</svg>
			</div>
			<span className='block w-full truncate px-1 text-sm font-black text-slate-950 sm:text-base'>
				{player.name}
			</span>
		</li>
	)
}

export function RoomLobbyScreen({
	role,
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
					<p className='mx-auto mt-5 max-w-xl rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm'>
						Переподключаемся к комнате...
					</p>
				) : null}

				{actionErrorMessage ? (
					<p className='mx-auto mt-5 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm'>
						{actionErrorMessage}
					</p>
				) : null}
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
					<button
						type='button'
						className='inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-500 px-7 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(245,158,11,0.28)] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60'
						onClick={onStartGame}
						disabled={startPending}
					>
						{startPending ? 'Запуск...' : 'Начать игру'}
					</button>
				) : (
					<p className='rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-sm font-black text-slate-700 shadow-[0_14px_36px_rgba(15,23,42,0.14)]'>
						Ждём, когда хост начнёт игру
					</p>
				)}
			</footer>
		</main>
	)
}
