import { useState, type FormEvent } from 'react'
import {
	AlertMessage,
	Button,
	Field,
	SelectControl,
	TextInput,
} from '../../shared/ui'
import { cn } from '../../shared/utils'
import type { CreateRoomRequest } from '@maptap/game-protocol'
import type { RoomMode } from '@maptap/game-domain/multiplayer'

const ROOM_MODE_OPTIONS: Array<{
	value: RoomMode
	label: string
}> = [
	{
		label: 'Игра в классе',
		value: 'classroom',
	},
	{
		label: 'Игра в группе',
		value: 'group',
	},
] as const

interface CreateRoomFormProps {
	onSubmit: (values: CreateRoomRequest) => Promise<void> | void
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
	const [roomMode, setRoomMode] = useState<RoomMode>('group')
	const trimmedHostName = hostName.trim()

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		if (!trimmedHostName) {
			return
		}

		void onSubmit({
			hostName: trimmedHostName,
			roomMode: roomMode,
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
				Новая комната
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

			<Field label='Режим комнаты'>
				<SelectControl
					accent='amber'
					className='rounded-lg border-slate-400 py-2 shadow-sm'
					value={roomMode}
					onChange={event => {
						setRoomMode(event.target.value as RoomMode)
					}}
				>
					{ROOM_MODE_OPTIONS.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</SelectControl>
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
