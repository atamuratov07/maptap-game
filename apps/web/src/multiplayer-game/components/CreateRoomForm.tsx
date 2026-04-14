import type { GameDifficulty, GameScope } from '@maptap/game-domain'
import { useState, type FormEvent, type JSX } from 'react'

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
			className='rounded-[29px] border border-white/60 bg-white/92 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8'
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
					<label className='block md:col-span-2'>
						<span className='mb-2 block text-sm font-semibold text-slate-800'>
							Имя хоста
						</span>
						<input
							type='text'
							value={formState.hostName}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									hostName: event.target.value,
								}))
							}}
							minLength={1}
							maxLength={32}
							className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
							placeholder='Введите имя'
						/>
					</label>

					<label className='block'>
						<span className='mb-2 block text-sm font-semibold text-slate-800'>
							Количество вопросов
						</span>
						<select
							value={formState.questionCount}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									questionCount: Number(event.target.value),
								}))
							}}
							className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
						>
							{QUESTION_COUNT_OPTIONS.map(option => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</label>

					<label className='block'>
						<span className='mb-2 block text-sm font-semibold text-slate-800'>
							Таймер вопроса
						</span>
						<select
							value={formState.questionDurationSeconds}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									questionDurationSeconds: Number(event.target.value),
								}))
							}}
							className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
						>
							{QUESTION_DURATION_OPTIONS.map(option => (
								<option key={option} value={option}>
									{option} сек.
								</option>
							))}
						</select>
					</label>

					<label className='block'>
						<span className='mb-2 block text-sm font-semibold text-slate-800'>
							Область
						</span>
						<select
							value={formState.scope}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									scope: event.target.value as GameScope,
								}))
							}}
							className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
						>
							{SCOPE_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>

					<label className='block'>
						<span className='mb-2 block text-sm font-semibold text-slate-800'>
							Сложность
						</span>
						<select
							value={formState.difficulty}
							onChange={event => {
								setFormState(currentState => ({
									...currentState,
									difficulty: event.target.value as GameDifficulty,
								}))
							}}
							className='w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
						>
							{DIFFICULTY_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
				</div>

				{submitError ? (
					<p className='mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700'>
						{submitError}
					</p>
				) : null}

				<button
					type='submit'
					className='mt-6 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60'
					disabled={pending || formState.hostName.trim().length === 0}
				>
					{pending ? 'Создаём...' : 'Создать комнату'}
				</button>
			</div>
		</form>
	)
}
