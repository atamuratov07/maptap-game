import type { GameConfig } from '@maptap/game-domain/multiplayer-next'
import { Gauge, Globe2, ListChecks, Timer } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { SelectControl } from '../../shared/ui'
import {
	DIFFICULTY_OPTIONS,
	loadRoomGameConfig,
	QUESTION_COUNT_OPTIONS,
	QUESTION_DURATION_MS_OPTIONS,
	saveRoomGameConfig,
	SCOPE_OPTIONS,
} from '../model/gameConfig'

interface GameConfigPanelProps {
	roomCode: string
	formId: string
	onStartGame: (config: GameConfig) => void
}

interface ConfigFieldProps {
	icon: JSX.Element
	label: string
	children: JSX.Element
}

function ConfigField({
	icon,
	label,
	children,
}: ConfigFieldProps): JSX.Element {
	return (
		<label className='group block rounded-2xl border border-slate-200 bg-white/88 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition hover:border-amber-300/80 hover:bg-white'>
			<span className='mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500'>
				<span className='grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700 transition group-hover:bg-amber-200'>
					{icon}
				</span>
				{label}
			</span>
			{children}
		</label>
	)
}

export function GameConfigPanel({
	roomCode,
	formId,
	onStartGame,
}: GameConfigPanelProps): JSX.Element {
	const [config, setConfig] = useState<GameConfig>(() =>
		loadRoomGameConfig(roomCode),
	)

	useEffect(() => {
		setConfig(loadRoomGameConfig(roomCode))
	}, [roomCode])

	useEffect(() => {
		saveRoomGameConfig(roomCode, config)
	}, [roomCode, config])

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		onStartGame(config)
	}

	return (
		<form
			id={formId}
			className='mx-auto mt-6 w-full max-w-5xl overflow-hidden rounded-[26px] border border-white/70 bg-white/94 text-left shadow-[0_24px_72px_rgba(15,23,42,0.14)] backdrop-blur'
			onSubmit={handleSubmit}
		>
			<div className='border-b border-slate-200/80 bg-linear-to-br from-white via-amber-50/80 to-teal-50/70 px-5 py-4 sm:px-6'>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-amber-700'>
					Настройки игры
				</p>
				<h2 className='mt-1 text-2xl font-black tracking-tight text-slate-950'>
					Раунд на карте
				</h2>
			</div>

			<div className='grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4'>
				<ConfigField
					icon={
						<ListChecks
							aria-hidden='true'
							size={17}
							strokeWidth={2.4}
						/>
					}
					label='Вопросы'
				>
					<SelectControl
						value={config.questionCount}
						className='h-12 rounded-2xl border-slate-200 bg-slate-50 font-black'
						onChange={event => {
							setConfig(current => ({
								...current,
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
				</ConfigField>

				<ConfigField
					icon={
						<Timer
							aria-hidden='true'
							size={17}
							strokeWidth={2.4}
						/>
					}
					label='Таймер'
				>
					<SelectControl
						value={config.questionDurationMs}
						className='h-12 rounded-2xl border-slate-200 bg-slate-50 font-black'
						onChange={event => {
							setConfig(current => ({
								...current,
								questionDurationMs: Number(event.target.value),
							}))
						}}
					>
						{QUESTION_DURATION_MS_OPTIONS.map(option => (
							<option key={option} value={option}>
								{option / 1000} сек.
							</option>
						))}
					</SelectControl>
				</ConfigField>

				<ConfigField
					icon={
						<Globe2
							aria-hidden='true'
							size={17}
							strokeWidth={2.4}
						/>
					}
					label='Регион'
				>
					<SelectControl
						value={config.scope}
						className='h-12 rounded-2xl border-slate-200 bg-slate-50 font-black'
						onChange={event => {
							setConfig(current => ({
								...current,
								scope: event.target.value as GameConfig['scope'],
							}))
						}}
					>
						{SCOPE_OPTIONS.map(option => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</SelectControl>
				</ConfigField>

				<ConfigField
					icon={
						<Gauge
							aria-hidden='true'
							size={17}
							strokeWidth={2.4}
						/>
					}
					label='Сложность'
				>
					<SelectControl
						value={config.difficulty}
						className='h-12 rounded-2xl border-slate-200 bg-slate-50 font-black'
						onChange={event => {
							setConfig(current => ({
								...current,
								difficulty: event.target
									.value as GameConfig['difficulty'],
							}))
						}}
					>
						{DIFFICULTY_OPTIONS.map(option => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</SelectControl>
				</ConfigField>
			</div>
		</form>
	)
}
