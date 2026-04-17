import {
	DEFAULT_GAME_CONFIG,
	type GameConfig,
} from '@maptap/game-domain/singleplayer'
import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
	ATTEMPTS_PER_QUESTION_OPTIONS,
	buildGamePath,
	DIFFICULTY_OPTIONS,
	QUESTION_COUNT_OPTIONS,
	SCOPE_OPTIONS,
} from '../core/config'

export function SetupPage(): JSX.Element {
	const navigate = useNavigate()
	const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG)

	const updateConfig = useCallback((patch: Partial<GameConfig>) => {
		setConfig(currentConfig => ({
			...currentConfig,
			...patch,
		}))
	}, [])

	const handleStart = useCallback(() => {
		navigate(buildGamePath(config))
	}, [config, navigate])

	const scopeLabel =
		SCOPE_OPTIONS.find(option => option.value === config.scope)?.label ??
		config.scope
	const difficultyLabel =
		DIFFICULTY_OPTIONS.find(option => option.value === config.difficulty)
			?.label ?? config.difficulty

	return (
		<main className='fixed inset-0 overflow-y-auto px-5 py-8 sm:px-8'>
			<div className='mx-auto max-w-3xl'>
				<div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
					<Link
						to='/'
						className='inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950'
					>
						<span aria-hidden='true'>&larr;</span>
						К режимам
					</Link>
				</div>

				<section className='rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8'>
					<h1 className='mb-2 text-5xl font-black leading-none tracking-tight text-slate-950'>
						Одиночная игра
					</h1>
					<p className='mb-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base'>
						Выберите настройки и начните игру.
					</p>

					<div className='grid gap-4 sm:grid-cols-2'>
						<label className='block'>
							<span className='mb-2 block text-sm font-semibold text-slate-800'>
								Количество вопросов
							</span>
							<select
								className='w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-300'
								value={config.questionCount}
								onChange={event => {
									updateConfig({
										questionCount: Number(event.target.value),
									})
								}}
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
								Попыток на вопрос
							</span>
							<select
								className='w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-300'
								value={config.attemptsPerQuestion}
								onChange={event => {
									updateConfig({
										attemptsPerQuestion: Number(event.target.value),
									})
								}}
							>
								{ATTEMPTS_PER_QUESTION_OPTIONS.map(option => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</label>

						<label className='block'>
							<span className='mb-2 block text-sm font-semibold text-slate-800'>
								Область карты
							</span>
							<select
								className='w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-300'
								value={config.scope}
								onChange={event => {
									updateConfig({
										scope: event.target.value as GameConfig['scope'],
									})
								}}
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
								Предел сложности
							</span>
							<select
								className='w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-300'
								value={config.difficulty}
								onChange={event => {
									updateConfig({
										difficulty: event.target
											.value as GameConfig['difficulty'],
									})
								}}
							>
								{DIFFICULTY_OPTIONS.map(option => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</label>
					</div>

					<div className='mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4'>
						<div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600'>
							<span>
								<strong className='text-slate-900'>
									{config.questionCount}
								</strong>{' '}
								вопросов
							</span>
							<span>
								<strong className='text-slate-900'>
									{config.attemptsPerQuestion}
								</strong>{' '}
								попыток
							</span>
							<span className='capitalize'>
								<strong className='text-slate-900'>{scopeLabel}</strong>
							</span>
							<span className='capitalize'>
								<strong className='text-slate-900'>
									{difficultyLabel}
								</strong>
							</span>
						</div>

						<button
							type='button'
							className='inline-flex items-center justify-center rounded-2xl bg-teal-700 px-4 py-3 text-sm font-black text-white shadow transition hover:-translate-y-0.5 hover:bg-teal-600'
							onClick={handleStart}
						>
							Начать игру
						</button>
					</div>
				</section>
			</div>
		</main>
	)
}
