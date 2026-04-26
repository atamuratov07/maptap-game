import { useState, type FormEvent, type JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, TextInput } from '../../shared/ui'
import { cn } from '../../shared/utils'

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
			className={cn(
				'h-fit rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_28px_70px_rgba(15,23,42,0.18)]',
				className,
			)}
			onSubmit={handleSubmit}
		>
			<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-300'>
				Войти в комнату
			</p>
			<h2 className='mt-3 text-3xl font-black tracking-tight'>По коду</h2>

			<Field
				label='Код комнаты'
				className='mt-6'
				labelClassName='text-slate-200'
			>
				<TextInput
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
					tone='dark'
					className='text-lg font-black tracking-[0.24em] focus:border-amber-400 focus:ring-amber-300/30'
					placeholder='ABC123'
				/>
			</Field>

			<Button
				type='submit'
				variant='inverse'
				is3d
				className='mt-6 px-5'
				disabled={roomCode.length !== 6}
			>
				Открыть комнату
			</Button>
		</form>
	)
}
