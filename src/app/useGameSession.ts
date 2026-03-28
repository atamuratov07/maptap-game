import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { createIdleState, gameReducer } from '../core/engine'
import { prepareGameSession } from '../core/session'
import type { GameConfig, GameState } from '../core/types'
import { loadGameData, toSessionCountryPool } from '../data/gameData'
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

export function useGameSession(config: GameConfig): UseGameSessionResult {
	const [gameData, setGameData] = useState<GameData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)

	const [engineState, dispatchEngineState] = useReducer(
		gameReducer,
		createIdleState(),
	)

	const sessionPool = useMemo(
		() => (gameData ? toSessionCountryPool(gameData) : null),
		[gameData],
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
			if (!sessionPool) {
				return
			}

			const result = prepareGameSession(sessionPool, nextConfig)
			if (!result.ok) {
				setLoadError(NO_COUNTRIES_ERROR)
				return
			}

			setLoadError(null)
			dispatchEngineState({
				type: 'START',
				session: result.session,
				now: Date.now(),
			})
		},
		[sessionPool],
	)

	useEffect(() => {
		if (!sessionPool || engineState.phase !== 'idle') {
			return
		}

		prepareAndStartGame(config)
	}, [config, engineState.phase, prepareAndStartGame, sessionPool])

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
