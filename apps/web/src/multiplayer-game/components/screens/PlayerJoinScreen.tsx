import { useState } from 'react'
import {
	AlertMessage,
	Button,
	ButtonLink,
	Field,
	ScreenShell,
	SurfacePanel,
	TextInput,
} from '../../../shared/ui'

interface PlayerJoinScreenProps {
	hostName: string
	joinable: boolean
	pending: boolean
	submitError: string | null
	resumeMessage: string | null
	onJoin: (playerName: string) => Promise<void>
}

export function PlayerJoinScreen({
	hostName,
	joinable,
	pending,
	submitError,
	resumeMessage,
	onJoin,
}: PlayerJoinScreenProps): JSX.Element {
	const [playerName, setPlayerName] = useState('')

	return (
		<ScreenShell center>
			<SurfacePanel
				width='xl'
				className='rounded-4xl border-white/60 bg-white/92 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8'
			>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-600'>
							Мультиплеер
						</p>
						<h1 className='mt-3 text-4xl font-black tracking-tight text-slate-950'>
							Присоединиться к игре
						</h1>
						<p className='mt-3 text-sm leading-7 text-slate-600'>
							Хост: {hostName}
						</p>
					</div>
					<ButtonLink
						to='/multiplayer'
						variant='secondary'
						size='pill'
					>
						Назад
					</ButtonLink>
				</div>

				{resumeMessage ? (
					<AlertMessage tone='warning' className='mt-5'>
						{resumeMessage}
					</AlertMessage>
				) : null}

				{submitError ? (
					<AlertMessage tone='error' className='mt-4'>
						{submitError}
					</AlertMessage>
				) : null}

				<div className='mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:p-6'>
					<Field label='Имя игрока'>
						<TextInput
							type='text'
							value={playerName}
							onChange={event => {
								setPlayerName(event.target.value)
							}}
							maxLength={20}
							placeholder='Введите имя'
						/>
					</Field>

					<Button
						type='button'
						className='mt-5 px-5'
						onClick={() => void onJoin(playerName)}
						disabled={
							!joinable || playerName.trim().length === 0 || pending
						}
					>
						{pending ? 'Входим...' : 'Войти'}
					</Button>

					{!joinable ? (
						<p className='mt-4 text-sm font-medium text-rose-700'>
							Присоединиться к этой комнате уже нельзя.
						</p>
					) : null}
				</div>
			</SurfacePanel>
		</ScreenShell>
	)
}
