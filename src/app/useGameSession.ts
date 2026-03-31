import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { createIdleState, gameReducer } from '../core/engine'
import type { GameErrorCode } from '../core/errors'
import { prepareGameSession } from '../core/session'
import type { GameConfig, GameState } from '../core/types'
import { loadGameData, toSessionCountryPool } from '../data/gameData'
import type { GameData } from '../data/types'

interface UseGameSessionResult {
	gameData: GameData | null
	isLoading: boolean
	loadErrorCode: GameErrorCode | null
	engineState: GameState
	eligibleIds: string[]
	reloadGameData: () => Promise<void>
	handleTryAgain: () => void
	handlePick: (countryId: string) => void
	handleGiveUp: () => void
	handleNext: () => void
}

export function useGameSession(config: GameConfig): UseGameSessionResult {
	const [gameData, setGameData] = useState<GameData | null>(null)
	const [eligibleIds, setEligibleIds] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [loadErrorCode, setLoadErrorCode] = useState<GameErrorCode | null>(
		null,
	)

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
		setLoadErrorCode(null)

		try {
			const loaded = await loadGameData()
			if (loaded.countryIds.length === 0) {
				setLoadErrorCode('no_playable_countries')
				setGameData(null)
				return
			}

			setGameData(loaded)
		} catch {
			setGameData(null)
			setLoadErrorCode('load_failed')
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
				setLoadErrorCode(result.error.code)
				return
			}

			setLoadErrorCode(null)
			setEligibleIds(result.session.eligibleIds)
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
		loadErrorCode,
		engineState,
		eligibleIds,
		reloadGameData,
		handleTryAgain,
		handlePick,
		handleGiveUp,
		handleNext,
	}
}
