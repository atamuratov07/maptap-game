import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
	CreateRoomForm,
	type CreateRoomFormValues,
} from '../components/CreateRoomForm'
import { formatGatewayErrorMessage } from '../core/errors'
import { saveRoomSession } from '../core/sessionStorage'
import { createSocketGateway } from '../core/socketGateway'
import type { RoomSession } from '../core/types'

export function HomePage(): JSX.Element {
	const navigate = useNavigate()
	const gateway = useMemo(() => createSocketGateway(), [])
	const [joinRoomCode, setJoinRoomCode] = useState('')
	const [createError, setCreateError] = useState<string | null>(null)
	const [isCreating, setIsCreating] = useState(false)

	useEffect(() => {
		return () => {
			gateway.disconnect()
		}
	}, [gateway])

	const handleCreateRoom = useCallback(
		async (values: CreateRoomFormValues) => {
			setIsCreating(true)
			setCreateError(null)

			try {
				const response = await gateway.createRoom({
					hostName: values.hostName,
					gameConfig: {
						questionCount: values.questionCount,
						difficulty: values.difficulty,
						scope: values.scope,
						questionDurationMs: values.questionDurationSeconds * 1000,
					},
				})

				const storedSession: RoomSession = {
					role: response.role,
					roomId: response.roomId,
					roomCode: response.roomCode,
					playerId: response.playerId,
					playerSessionToken: response.playerSessionToken,
					savedAt: Date.now(),
				}

				saveRoomSession(storedSession)
				navigate(`/multiplayer/host/${response.roomCode}`)
			} catch (error) {
				setCreateError(formatGatewayErrorMessage(error))
			} finally {
				setIsCreating(false)
			}
		},
		[gateway, navigate],
	)

	return (
		<main className='min-h-screen px-5 py-8 sm:px-8'>
			<div className='mx-auto max-w-6xl'>
				<div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
					<Link
						to='/'
						className='inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950'
					>
						<span aria-hidden='true'>&larr;</span>К режимам
					</Link>
				</div>

				<div className='grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]'>
					<CreateRoomForm
						onSubmit={handleCreateRoom}
						pending={isCreating}
						submitError={createError}
					/>

					<aside className='rounded-[28px] h-fit border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_28px_70px_rgba(15,23,42,0.18)]'>
						<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-300'>
							Войти в комнату
						</p>
						<h2 className='mt-3 text-3xl font-black tracking-tight'>
							По коду
						</h2>

						<label className='mt-6 block'>
							<span className='mb-2 block text-sm font-semibold text-slate-200'>
								Код комнаты
							</span>
							<input
								type='text'
								value={joinRoomCode}
								onChange={event => {
									setJoinRoomCode(
										event.target.value
											.toUpperCase()
											.replace(/[^A-Z0-9]/g, '')
											.slice(0, 6),
									)
								}}
								className='w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-lg font-black tracking-[0.24em] text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-300/30'
								placeholder='ABC123'
							/>
						</label>

						<button
							type='button'
							className='mt-6 inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60'
							onClick={() => {
								navigate(`/multiplayer/room/${joinRoomCode}`)
							}}
							disabled={joinRoomCode.length !== 6}
						>
							Открыть комнату
						</button>
					</aside>
				</div>
			</div>
		</main>
	)
}
