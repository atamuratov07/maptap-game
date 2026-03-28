import { useCallback, useEffect, useReducer, useState } from 'react'
import { createIdleState, gameReducer } from '../core/engine'
import { pickRandomIds } from '../core/random'
import type { GameConfig } from '../core/types'
import { loadGameData } from '../data/gameData'
import type { CountryDifficulty, GameData } from '../data/types'
import { toErrorMessage } from '../shared/utils'
import { GameScreen } from '../ui/GameScreen'
import { ResultModal } from '../ui/ResultModal'

interface GameProps {
	config: GameConfig
	onBackToHome: () => void
}

const NO_COUNTRIES_ERROR =
	'Не найдено совпадений между геометрией карты и данными о странах.'

function selectEligibleIds(gameData: GameData, config: GameConfig): string[] {
	const difficultyRank: Record<CountryDifficulty, number> = {
		easy: 0,
		medium: 1,
		hard: 2,
	}

	return gameData.allowedIds.filter(id => {
		const info = gameData.infoMap.get(id)

		return (
			info &&
			difficultyRank[info.difficulty] <= difficultyRank[config.difficulty]
		)
	})
}

export function Game({ config, onBackToHome }: GameProps): JSX.Element {
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
				setLoadError(NO_COUNTRIES_ERROR)
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

			const eligibleIds = selectEligibleIds(gameData, nextConfig)
			const questionIds = pickRandomIds(
				eligibleIds,
				nextConfig.questionCount,
			)

			if (questionIds.length === 0) {
				setLoadError(NO_COUNTRIES_ERROR)
				return
			}

			dispatchEngineState({
				type: 'START',
				config: {
					...nextConfig,
					questionCount: questionIds.length,
				},
				questionIds,
				now: Date.now(),
			})
		},
		[gameData],
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

	if (isLoading) {
		return (
			<div className='grid min-h-screen place-items-center px-5'>
				<div className='w-full max-w-115 rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-[0_15px_35px_rgba(15,23,42,0.12)]'>
					<h1 className='mb-2 text-2xl font-bold text-slate-900'>
						Загрузка MapTap
					</h1>
					<p className='text-slate-700'>
						Загружаем геометрию карты и данные о странах...
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
						Не удалось загрузить данные игры
					</h1>
					<p className='mb-4 text-slate-700'>
						{loadError || 'Неизвестная ошибка.'}
					</p>
					<button
						type='button'
						className='rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow transition hover:-translate-y-0.5 hover:bg-teal-600'
						onClick={() => void loadData()}
					>
						Повторить
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen'>
			<GameScreen
				state={engineState}
				infoMap={gameData.infoMap}
				onPick={handlePick}
				onGiveUp={handleGiveUp}
				onNext={handleNext}
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
