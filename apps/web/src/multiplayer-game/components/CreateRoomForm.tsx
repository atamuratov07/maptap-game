import type { GameDifficulty, GameScope } from '@maptap/game-domain'
import { useState, type FormEvent, type JSX } from 'react'
import { AlertMessage, Button, Field, SelectControl, TextInput } from '../../shared/ui'
import { cn } from '../../shared/utils'

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const
const QUESTION_DURATION_OPTIONS = [15, 20, 30, 45, 60] as const
const DIFFICULTY_OPTIONS: Array<{
	value: GameDifficulty
	label: string
}> = [
	{
		value: 'easy',
		label: 'Лёгкая',
	},
	{
		value: 'medium',
		label: 'Средняя',
	},
	{
		value: 'hard',
		label: 'Сложная',
	},
]
const SCOPE_OPTIONS: Array<{
	value: GameScope
	label: string
}> = [
	{ value: 'all', label: 'Весь мир' },
	{ value: 'africa', label: 'Африка' },
	{ value: 'asia', label: 'Азия' },
	{ value: 'europe', label: 'Европа' },
	{ value: 'north-america', label: 'Северная Америка' },
	{ value: 'south-america', label: 'Южная Америка' },
	{ value: 'oceania', label: 'Океания' },
]

export interface CreateRoomFormValues {
	hostName: string
	questionCount: number
	scope: GameScope
	difficulty: GameDifficulty
	questionDurationSeconds: number
}

interface CreateRoomFormProps {
	onSubmit: (values: CreateRoomFormValues) => Promise<void> | void
	pending: boolean
	submitError: string | null
	className?: string
}

const DEFAULT_FORM_STATE: CreateRoomFormValues = {
	hostName: '',
	questionCount: 10,
	scope: 'all',
	difficulty: 'easy',
	questionDurationSeconds: 30,
}

export function CreateRoomForm({
	onSubmit,
	pending,
	submitError,
	className,
}: CreateRoomFormProps): JSX.Element {
	const [formState, setFormState] =
		useState<CreateRoomFormValues>(DEFAULT_FORM_STATE)

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		void onSubmit({
			...formState,
			hostName: formState.hostName.trim(),
		})
	}

	return (
		<form
			className={cn(
				'rounded-[29px] border border-white/60 bg-white/92 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8',
				className,
			)}
			onSubmit={handleSubmit}
		>
			<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-600'>
				Создать комнату
			</p>
			<h1 className='mt-3 text-4xl font-black tracking-tight text-slate-950'>
				Новая комната
			</h1>

			<div className='mt-6'>
				<div className='grid gap-4 md:grid-cols-2'>
					<Field label='Имя хоста' className='md:col-span-2'>
						<TextInput
							type='text'
							value={formState.hostName}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									hostName: event.target.value,
								}))
							}}
							minLength={1}
							maxLength={20}
							placeholder='Введите имя'
						/>
					</Field>

					<Field label='Количество вопросов'>
						<SelectControl
							value={formState.questionCount}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									questionCount: Number(event.target.value),
								}))
							}}
						>
							{QUESTION_COUNT_OPTIONS.map(option => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</SelectControl>
					</Field>

					<Field label='Таймер вопроса'>
						<SelectControl
							value={formState.questionDurationSeconds}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									questionDurationSeconds: Number(event.target.value),
								}))
							}}
						>
							{QUESTION_DURATION_OPTIONS.map(option => (
								<option key={option} value={option}>
									{option} сек.
								</option>
							))}
						</SelectControl>
					</Field>

					<Field label='Область'>
						<SelectControl
							value={formState.scope}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									scope: event.target.value as GameScope,
								}))
							}}
						>
							{SCOPE_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</SelectControl>
					</Field>

					<Field label='Сложность'>
						<SelectControl
							value={formState.difficulty}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									difficulty: event.target.value as GameDifficulty,
								}))
							}}
						>
							{DIFFICULTY_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</SelectControl>
					</Field>
				</div>

				{submitError ? (
					<AlertMessage tone='error' className='mt-4'>
						{submitError}
					</AlertMessage>
				) : null}

				<Button
					type='submit'
					className='mt-6 px-5 hover:-translate-y-0.5'
					disabled={pending || formState.hostName.trim().length === 0}
				>
					{pending ? 'Создаём...' : 'Создать комнату'}
				</Button>
			</div>
		</form>
	)
}
