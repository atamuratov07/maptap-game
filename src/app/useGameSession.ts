import { useCallback, useEffect, useReducer, useState } from 'react'
import { createIdleState, gameReducer } from '../core/engine'
import { pickRandomIds } from '../core/random'
import type { GameConfig, GameDifficulty, GameState } from '../core/types'
import { loadGameData } from '../data/gameData'
import type { GameData } from '../data/types'
import { toErrorMessage } from '../shared/utils'

const NO_COUNTRIES_ERROR =
	'Не найдено совпадений между геометрией карты и данными о странах.'

interface UseGameSessionResult {
	gameData: GameData | null
	isLoading: boolean
	loadError: string | null
	engineState: GameState
	reloadGameData: () => Promise<void>
	handleTryAgain: () => void
	handlePick: (countryId: string) => void
	handleGiveUp: () => void
	handleNext: () => void
}

function selectEligibleIds(gameData: GameData, config: GameConfig): string[] {
	const difficultyRank: Record<GameDifficulty, number> = {
		easy: 0,
		medium: 1,
		hard: 2,
	}
	return gameData.allowedIds.filter(id => {
		const info = gameData.countriesInfo.get(id)

		return (
			info &&
			difficultyRank[info.difficulty] <= difficultyRank[config.difficulty]
		)
	})
}

export function useGameSession(config: GameConfig): UseGameSessionResult {
	const [gameData, setGameData] = useState<GameData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)

	const [engineState, dispatchEngineState] = useReducer(
		gameReducer,
		createIdleState(),
	)

	const reloadGameData = useCallback(async () => {
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
		void reloadGameData()
	}, [reloadGameData])

	const prepareAndStartGame = useCallback(
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

		prepareAndStartGame(config)
	}, [config, engineState.phase, gameData, prepareAndStartGame])

	const handleTryAgain = useCallback(() => {
		prepareAndStartGame(engineState.config)
	}, [engineState.config, prepareAndStartGame])

	const handlePick = useCallback(
		(countryId: string) => {
			if (!gameData?.countriesInfo.has(countryId)) {
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

	return {
		gameData,
		isLoading,
		loadError,
		engineState,
		reloadGameData,
		handleTryAgain,
		handlePick,
		handleGiveUp,
		handleNext,
	}
}
