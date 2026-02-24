import type { RendererKind } from '../core/engine'

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
		<section className='home-screen'>
			<div className='home-card'>
				<h1 className='home-title'>MapTap</h1>
				<p className='home-subtitle'>
					Находите страны на карте и запоминайте их ключевые факты.
				</p>

				<label className='form-row'>
					<span>Количество вопросов</span>
					<select
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

				<label className='form-row'>
					<span>Режим карты</span>
					<select
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

				<div className='home-actions'>
					<button
						type='button'
						className='primary-button'
						onClick={onStart}
						disabled={startDisabled}
					>
						Начать
					</button>
				</div>
			</div>
		</section>
	)
}
