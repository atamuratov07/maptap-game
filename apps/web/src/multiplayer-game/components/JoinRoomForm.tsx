import { useState, type FormEvent, type JSX } from 'react'
import { useNavigate } from 'react-router-dom'

export function JoinRoomForm({
	className,
}: {
	className?: string
}): JSX.Element {
	const navigate = useNavigate()
	const [roomCode, setRoomCode] = useState('')

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		if (roomCode.length !== 6) {
			return
		}

		navigate(`/multiplayer/room/${roomCode}`)
	}

	return (
		<form
			className={`rounded-[28px] h-fit border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_28px_70px_rgba(15,23,42,0.18)] ${className ?? ''}`}
			onSubmit={handleSubmit}
		>
			<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-300'>
				Войти в комнату
			</p>
			<h2 className='mt-3 text-3xl font-black tracking-tight'>По коду</h2>

			<label className='mt-6 block'>
				<span className='mb-2 block text-sm font-semibold text-slate-200'>
					Код комнаты
				</span>
				<input
					type='text'
					value={roomCode}
					onChange={event => {
						setRoomCode(
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
				type='submit'
				className='mt-6 inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60'
				disabled={roomCode.length !== 6}
			>
				Открыть комнату
			</button>
		</form>
	)
}
