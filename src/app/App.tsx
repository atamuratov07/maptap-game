import { useCallback, useMemo, useState } from 'react'
import type { GameConfig, RendererKind } from '../core/types'
import { HomeScreen } from '../ui/HomeScreen'
import { Game } from './Game'

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20]
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

function buildGameConfig(
	questionCount: number,
	rendererKind: RendererKind,
	attemptsPerQuestion: number,
): GameConfig {
	return {
		questionCount,
		rendererKind,
		attemptsPerQuestion,
	}
}

export default function App(): JSX.Element {
	const [questionCount, setQuestionCount] = useState(10)
	const [rendererKind, setRendererKind] = useState<RendererKind>('mapbox')
	const [mapboxAvailable, setMapboxAvailable] = useState(Boolean(MAPBOX_TOKEN))
	const [activeConfig, setActiveConfig] = useState<GameConfig | null>(null)

	const effectiveHomeRendererKind: RendererKind =
		rendererKind === 'mapbox' && !mapboxAvailable
			? 'svg'
			: rendererKind

	const handleMapboxUnavailable = useCallback(() => {
		setMapboxAvailable(false)
	}, [])

	const handleStart = useCallback(() => {
		setActiveConfig(
			buildGameConfig(questionCount, effectiveHomeRendererKind, 3),
		)
	}, [effectiveHomeRendererKind, questionCount])

	const handleBackToHome = useCallback(() => {
		setActiveConfig(null)
	}, [])

	const mapModeOptions = useMemo(
		() =>
			mapboxAvailable
				? [
						{
							value: 'svg' as RendererKind,
							label: '2D Map',
						},
						{
							value: 'mapbox' as RendererKind,
							label: '3D Globe (Beta)',
						},
					]
				: [
						{
							value: 'svg' as RendererKind,
							label: '2D Map',
						},
					],
		[mapboxAvailable],
	)

	if (!activeConfig) {
		return (
			<div className='min-h-screen'>
				<HomeScreen
					questionCount={questionCount}
					questionCountOptions={QUESTION_COUNT_OPTIONS}
					rendererKind={effectiveHomeRendererKind}
					mapModeOptions={mapModeOptions}
					onQuestionCountChange={setQuestionCount}
					onRendererKindChange={setRendererKind}
					onStart={handleStart}
				/>
			</div>
		)
	}

	return (
		<Game
			config={activeConfig}
			mapboxAvailable={mapboxAvailable}
			onMapboxUnavailable={handleMapboxUnavailable}
			onBackToHome={handleBackToHome}
		/>
	)
}
