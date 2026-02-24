import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import {
	createHomeState,
	gameReducer,
	type GameConfig,
	type RendererKind,
} from '../core/engine'
import { pickRandomIds } from '../core/random'
import { loadGameData } from '../data/gameData'
import type { GameData } from '../data/types'
import { GameScreen } from '../ui/GameScreen'
import { HomeScreen } from '../ui/HomeScreen'
import { ResultModal } from '../ui/ResultModal'

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20]
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

function toErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return `Ошибка: ${error.message}`
	}

	return 'Непредвиденная ошибка при загрузке карты или данных стран.'
}

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
	const [gameData, setGameData] = useState<GameData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)

	const [homeQuestionCount, setHomeQuestionCount] = useState(10)
	const [homeRendererKind, setHomeRendererKind] = useState<RendererKind>('svg')
	const [mapboxAvailable, setMapboxAvailable] = useState(Boolean(MAPBOX_TOKEN))

	const [engineState, dispatch] = useReducer(gameReducer, createHomeState())
	const [timerNow, setTimerNow] = useState(Date.now())

	const loadData = useCallback(async () => {
		setIsLoading(true)
		setLoadError(null)

		try {
			const loaded = await loadGameData()
			if (loaded.allowedIds.length === 0) {
				setLoadError(
					'Не найдено совпадений между геометрией карты и данными о странах.',
				)
				setGameData(null)
				return
			}

			setGameData(loaded)
		} catch (error) {
			setGameData(null)
			setLoadError(toErrorMessage(error))
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		void loadData()
	}, [loadData])

	useEffect(() => {
		if (!mapboxAvailable && homeRendererKind === 'mapbox') {
			setHomeRendererKind('svg')
		}
	}, [homeRendererKind, mapboxAvailable])

	const startGame = useCallback(
		(config: GameConfig) => {
			if (!gameData) {
				return
			}

			const rendererKind: RendererKind =
				config.rendererKind === 'mapbox' && mapboxAvailable
					? 'mapbox'
					: 'svg'

			const questionIds = pickRandomIds(
				gameData.allowedIds,
				config.questionCount,
			)
			dispatch({
				type: 'START',
				config: {
					...config,
					rendererKind,
					questionCount: questionIds.length,
				},
				questionIds,
				now: Date.now(),
			})
		},
		[gameData, mapboxAvailable],
	)

	const handleStart = useCallback(() => {
		startGame(buildGameConfig(homeQuestionCount, homeRendererKind, 3))
	}, [homeQuestionCount, homeRendererKind, startGame])

	const handleTryAgain = useCallback(() => {
		startGame(engineState.config)
	}, [engineState.config, startGame])

	const handlePick = useCallback(
		(countryId: string) => {
			if (!gameData?.infoMap.has(countryId)) {
				return
			}

			dispatch({
				type: 'PICK',
				countryId,
				now: Date.now(),
			})
		},
		[gameData],
	)

	const handleGiveUp = useCallback(() => {
		dispatch({
			type: 'GIVE_UP',
			now: Date.now(),
		})
	}, [])

	const handleNext = useCallback(() => {
		dispatch({
			type: 'NEXT',
			now: Date.now(),
		})
	}, [])

	const handleHome = useCallback(() => {
		dispatch({
			type: 'HOME',
		})
	}, [])

	const handleMapboxUnavailable = useCallback(() => {
		setMapboxAvailable(false)
	}, [])

	useEffect(() => {
		if (engineState.phase !== 'playing') {
			return
		}

		setTimerNow(Date.now())
		const intervalId = window.setInterval(() => {
			setTimerNow(Date.now())
		}, 1000)

		return () => {
			window.clearInterval(intervalId)
		}
	}, [engineState.index, engineState.phase, engineState.questionStartedAt])

	const elapsedSeconds = useMemo(() => {
		if (engineState.questionStartedAt <= 0) {
			return 0
		}

		const endTime =
			engineState.phase === 'playing'
				? timerNow
				: (engineState.questionResolvedAt ?? timerNow)

		return Math.max(
			0,
			Math.floor((endTime - engineState.questionStartedAt) / 1000),
		)
	}, [
		engineState.phase,
		engineState.questionResolvedAt,
		engineState.questionStartedAt,
		timerNow,
	])

	const mapModeOptions = useMemo(
		() =>
			mapboxAvailable
				? [
						{
							value: 'svg' as RendererKind,
							label: 'Карта 2D',
						},
						{
							value: 'mapbox' as RendererKind,
							label: 'Глобус 3D (бета)',
						},
					]
				: [
						{
							value: 'svg' as RendererKind,
							label: 'Карта 2D',
						},
					],
		[mapboxAvailable],
	)

	const activeRendererKind: RendererKind =
		engineState.config.rendererKind === 'mapbox' && mapboxAvailable
			? 'mapbox'
			: 'svg'

	if (isLoading) {
		return (
			<div className='status-screen'>
				<div className='status-card'>
					<h1>Загрузка MapTap</h1>
					<p>Загружаем геометрию карты и факты о странах...</p>
				</div>
			</div>
		)
	}

	if (loadError || !gameData) {
		return (
			<div className='status-screen'>
				<div className='status-card'>
					<h1>Не удалось загрузить данные игры</h1>
					<p>{loadError || 'Неизвестная ошибка.'}</p>
					<button
						type='button'
						className='primary-button'
						onClick={() => void loadData()}
					>
						Повторить
					</button>
				</div>
			</div>
		)
	}

	if (engineState.phase === 'home') {
		return (
			<div className='app-shell'>
				<HomeScreen
					questionCount={homeQuestionCount}
					questionCountOptions={QUESTION_COUNT_OPTIONS}
					rendererKind={homeRendererKind}
					mapModeOptions={mapModeOptions}
					onQuestionCountChange={setHomeQuestionCount}
					onRendererKindChange={setHomeRendererKind}
					onStart={handleStart}
					startDisabled={gameData.allowedIds.length === 0}
				/>
			</div>
		)
	}

	return (
		<div className='app-shell'>
			<GameScreen
				state={engineState}
				features={gameData.features}
				infoMap={gameData.infoMap}
				rendererKind={activeRendererKind}
				mapboxToken={MAPBOX_TOKEN}
				elapsedSeconds={elapsedSeconds}
				onPick={handlePick}
				onGiveUp={handleGiveUp}
				onNext={handleNext}
				onMapboxUnavailable={handleMapboxUnavailable}
			/>

			<ResultModal
				open={engineState.phase === 'finished'}
				score={engineState.score}
				correctCount={engineState.correctCount}
				totalCount={engineState.questionIds.length}
				onTryAgain={handleTryAgain}
				onHome={handleHome}
			/>
		</div>
	)
}
