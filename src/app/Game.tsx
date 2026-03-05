import { useCallback, useEffect, useReducer, useState } from 'react'
import { createIdleState, gameReducer } from '../core/engine'
import { pickRandomIds } from '../core/random'
import type { GameConfig, RendererKind } from '../core/types'
import { loadGameData } from '../data/gameData'
import type { GameData } from '../data/types'
import { toErrorMessage } from '../shared/utils'
import { GameScreen } from '../ui/GameScreen'
import { ResultModal } from '../ui/ResultModal'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

interface GameProps {
	config: GameConfig
	mapboxAvailable: boolean
	onMapboxUnavailable: () => void
	onBackToHome: () => void
}

export function Game({
	config,
	mapboxAvailable,
	onMapboxUnavailable,
	onBackToHome,
}: GameProps): JSX.Element {
	const [gameData, setGameData] = useState<GameData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)

	const [engineState, dispatchEngineState] = useReducer(
		gameReducer,
		createIdleState(),
	)

	const loadData = useCallback(async () => {
		setIsLoading(true)
		setLoadError(null)

		try {
			const loaded = await loadGameData()
			if (loaded.allowedIds.length === 0) {
				setLoadError(
					'No matches were found between map geometry and country facts.',
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

	const startGame = useCallback(
		(nextConfig: GameConfig) => {
			if (!gameData) {
				return
			}

			const rendererKind: RendererKind =
				nextConfig.rendererKind === 'mapbox' && !mapboxAvailable
					? 'svg'
					: nextConfig.rendererKind

			const questionIds = pickRandomIds(
				gameData.allowedIds,
				nextConfig.questionCount,
			)

			if (questionIds.length === 0) {
				setLoadError(
					'No matches were found between map geometry and country facts.',
				)
				return
			}

			dispatchEngineState({
				type: 'START',
				config: {
					...nextConfig,
					rendererKind,
					questionCount: questionIds.length,
				},
				questionIds,
				now: Date.now(),
			})
		},
		[gameData, mapboxAvailable],
	)

	useEffect(() => {
		if (!gameData || engineState.phase !== 'idle') {
			return
		}

		startGame(config)
	}, [config, engineState.phase, gameData, startGame])

	const handleTryAgain = useCallback(() => {
		startGame(engineState.config)
	}, [engineState.config, startGame])

	const handlePick = useCallback(
		(countryId: string) => {
			if (!gameData?.infoMap.has(countryId)) {
				return
			}

			dispatchEngineState({
				type: 'PICK',
				countryId,
				now: Date.now(),
			})
		},
		[gameData],
	)

	const handleGiveUp = useCallback(() => {
		dispatchEngineState({
			type: 'GIVE_UP',
			now: Date.now(),
		})
	}, [])

	const handleNext = useCallback(() => {
		dispatchEngineState({
			type: 'NEXT',
			now: Date.now(),
		})
	}, [])

	const activeRendererKind: RendererKind =
		engineState.config.rendererKind === 'mapbox' && !mapboxAvailable
			? 'svg'
			: engineState.config.rendererKind

	if (isLoading) {
		return (
			<div className='grid min-h-screen place-items-center px-5'>
				<div className='w-full max-w-115 rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-[0_15px_35px_rgba(15,23,42,0.12)]'>
					<h1 className='mb-2 text-2xl font-bold text-slate-900'>
						Loading MapTap
					</h1>
					<p className='text-slate-700'>
						Fetching map geometry and country facts...
					</p>
				</div>
			</div>
		)
	}

	if (loadError || !gameData) {
		return (
			<div className='grid min-h-screen place-items-center px-5'>
				<div className='w-full max-w-115 rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-[0_15px_35px_rgba(15,23,42,0.12)]'>
					<h1 className='mb-2 text-2xl font-bold text-slate-900'>
						Failed to load game data
					</h1>
					<p className='mb-4 text-slate-700'>
						{loadError || 'Unknown error.'}
					</p>
					<button
						type='button'
						className='rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow transition hover:-translate-y-0.5 hover:bg-teal-600'
						onClick={() => void loadData()}
					>
						Retry
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen'>
			<GameScreen
				state={engineState}
				features={gameData.features}
				infoMap={gameData.infoMap}
				rendererKind={activeRendererKind}
				mapboxToken={MAPBOX_TOKEN}
				onPick={handlePick}
				onGiveUp={handleGiveUp}
				onNext={handleNext}
				onMapboxUnavailable={onMapboxUnavailable}
			/>

			<ResultModal
				open={engineState.phase === 'finished'}
				score={engineState.score}
				correctCount={engineState.correctCount}
				totalCount={engineState.questionIds.length}
				onTryAgain={handleTryAgain}
				onHome={onBackToHome}
			/>
		</div>
	)
}
