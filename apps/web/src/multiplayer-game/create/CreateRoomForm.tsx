import { useState, type FormEvent } from 'react'
import { AlertMessage, Button, Field, TextInput } from '../../shared/ui'
import { cn } from '../../shared/utils'

export interface CreateRoomFormValues {
	hostName: string
}

interface CreateRoomFormProps {
	onSubmit: (values: CreateRoomFormValues) => Promise<void> | void
	pending: boolean
	submitError: string | null
	className?: string
}

export function CreateRoomForm({
	onSubmit,
	pending,
	submitError,
	className,
}: CreateRoomFormProps): JSX.Element {
	const [hostName, setHostName] = useState('')
	const trimmedHostName = hostName.trim()

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		if (!trimmedHostName) {
			return
		}

		void onSubmit({
			hostName: trimmedHostName,
		})
	}

	return (
		<form
			className={cn(
				'w-full max-w-xl rounded-[29px] border border-white/60 bg-white/92 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8',
				className,
			)}
			onSubmit={handleSubmit}
		>
			<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-600'>
				Создание комнаты
			</p>
			<h1 className='mt-3 text-4xl font-black tracking-tight text-slate-950'>
				Новая мультиплеерная комната
			</h1>

			<Field label='Имя хоста' className='mt-6'>
				<TextInput
					type='text'
					value={hostName}
					onChange={event => {
						setHostName(event.target.value)
					}}
					minLength={1}
					maxLength={20}
					placeholder='Введите имя хоста'
				/>
			</Field>

			{submitError ? (
				<AlertMessage tone='error' className='mt-5'>
					{submitError}
				</AlertMessage>
			) : null}

			<Button
				type='submit'
				is3d
				className='mt-6 px-5'
				disabled={pending || trimmedHostName.length === 0}
			>
				{pending ? 'Создаём...' : 'Создать комнату'}
			</Button>
		</form>
	)
}
