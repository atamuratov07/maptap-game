import {
	DEFAULT_GAME_CONFIG,
	type GameConfig,
} from '@maptap/game-domain/singleplayer'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	Button,
	ButtonLink,
	Field,
	ScreenShell,
	SelectControl,
	SurfacePanel,
} from '../../shared/ui'
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
		<ScreenShell className='sm:px-8'>
			<div className='mx-auto max-w-3xl'>
				<div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
					<ButtonLink
						to='/'
						variant='nav'
						size='pill'
					>
						<span aria-hidden='true'>&larr;</span>
						К режимам
					</ButtonLink>
				</div>

				<SurfacePanel
					width='xl'
					className='border-white/60 bg-white/90 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8'
				>
					<h1 className='mb-2 text-5xl font-black leading-none tracking-tight text-slate-950'>
						Одиночная игра
					</h1>
					<p className='mb-6 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base'>
						Выберите настройки и начните игру.
					</p>

					<div className='grid gap-4 sm:grid-cols-2'>
						<Field label='Количество вопросов'>
							<SelectControl
								accent='teal'
								className='rounded-lg border-slate-400 py-2 shadow-sm'
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
							</SelectControl>
						</Field>

						<Field label='Попыток на вопрос'>
							<SelectControl
								accent='teal'
								className='rounded-lg border-slate-400 py-2 shadow-sm'
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
							</SelectControl>
						</Field>

						<Field label='Область карты'>
							<SelectControl
								accent='teal'
								className='rounded-lg border-slate-400 py-2 shadow-sm'
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
							</SelectControl>
						</Field>

						<Field label='Предел сложности'>
							<SelectControl
								accent='teal'
								className='rounded-lg border-slate-400 py-2 shadow-sm'
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
							</SelectControl>
						</Field>
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

						<Button
							type='button'
							variant='teal'
							className='hover:-translate-y-0.5'
							onClick={handleStart}
						>
							Начать игру
						</Button>
					</div>
				</SurfacePanel>
			</div>
		</ScreenShell>
	)
}
