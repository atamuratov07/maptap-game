import type { RendererKind } from '../core/types'

interface MapModeOption {
	value: RendererKind
	label: string
}

interface HomeScreenProps {
	questionCount: number
	questionCountOptions: number[]
	rendererKind: RendererKind
	mapModeOptions: MapModeOption[]
	onQuestionCountChange: (value: number) => void
	onRendererKindChange: (value: RendererKind) => void
	onStart: () => void
	startDisabled?: boolean
}

export function HomeScreen({
	questionCount,
	questionCountOptions,
	rendererKind,
	mapModeOptions,
	onQuestionCountChange,
	onRendererKindChange,
	onStart,
	startDisabled = false,
}: HomeScreenProps): JSX.Element {
	return (
		<section className='grid min-h-screen place-items-center px-5 py-8'>
			<div className='w-full max-w-md rounded-2xl border border-slate-300 bg-white/95 p-6 shadow-[0_18px_38px_rgba(15,23,42,0.12)]'>
				<h1 className='mb-2 text-5xl font-black leading-none tracking-tight text-slate-900'>
					MapTap
				</h1>
				<p className='mb-5 text-sm leading-relaxed text-slate-600'>
					Find countries on the map and remember their key facts.
				</p>

				<label className='mb-4 block'>
					<span className='mb-2 block text-sm font-semibold text-slate-800'>
						Question count
					</span>
					<select
						className='w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-300'
						value={questionCount}
						onChange={event => {
							onQuestionCountChange(Number(event.target.value))
						}}
					>
						{questionCountOptions.map(option => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</label>

				<label className='mb-5 block'>
					<span className='mb-2 block text-sm font-semibold text-slate-800'>
						Map mode
					</span>
					<select
						className='w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-300'
						value={rendererKind}
						onChange={event => {
							onRendererKindChange(event.target.value as RendererKind)
						}}
					>
						{mapModeOptions.map(option => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>

				<button
					type='button'
					className='inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:-translate-y-0.5 hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-55'
					onClick={onStart}
					disabled={startDisabled}
				>
					Start
				</button>
			</div>
		</section>
	)
}
