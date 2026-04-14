interface RoomLobbyScreenProps {
	role: 'host' | 'player'
	startPending?: boolean
	actionErrorMessage?: string | null
	isReconnecting?: boolean
	onStartGame?: () => void
}

export function RoomLobbyScreen({
	role,
	startPending = false,
	actionErrorMessage = null,
	isReconnecting = false,
	onStartGame,
}: RoomLobbyScreenProps): JSX.Element {
	const isHost = role === 'host'

	return (
		<main className='grid min-h-screen place-items-center px-5 py-8'>
			<section className='w-full max-w-xl rounded-[32px] border border-white/60 bg-white/92 p-8 text-center shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur'>
				<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-600'>
					Лобби
				</p>
				<h1 className='mt-3 text-4xl font-black tracking-tight text-slate-950'>
					{isHost ? 'Подготовка к игре' : 'Ждём старт'}
				</h1>
				<p className='mt-4 text-sm leading-7 text-slate-600'>
					{isHost
						? 'Когда все готовы, запускайте игру. После старта комната перейдёт в полноэкранный игровой режим.'
						: 'Хост скоро начнёт игру. Карта откроется сразу в полноэкранном режиме.'}
				</p>

				{isReconnecting ? (
					<p className='mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700'>
						Переподключаемся к комнате...
					</p>
				) : null}

				{actionErrorMessage ? (
					<p className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700'>
						{actionErrorMessage}
					</p>
				) : null}

				{isHost ? (
					<button
						type='button'
						className='mt-6 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60'
						onClick={onStartGame}
						disabled={startPending}
					>
						{startPending ? 'Запуск...' : 'Начать игру'}
					</button>
				) : null}
			</section>
		</main>
	)
}
