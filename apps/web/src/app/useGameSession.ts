import type { SessionPreparationError } from '@maptap/game-domain'
import {
	createIdleGameState,
	prepareGameSession,
	reduceGameState,
	type GameConfig,
	type GameState,
} from '@maptap/game-domain/singleplayer'
import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from 'react'
import { loadGameData, toSessionCountryPool } from '../data/gameData'
import type { GameData } from '../data/types'

export type GameLoadErrorCode =
	| SessionPreparationError['code']
	| 'load_failed'
	| 'no_playable_countries'

interface UseGameSessionResult {
	gameData: GameData | null
	isLoading: boolean
	loadErrorCode: GameLoadErrorCode | null
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
	const [loadErrorCode, setLoadErrorCode] = useState<GameLoadErrorCode | null>(
		null,
	)

	const [engineState, dispatchEngineState] = useReducer(
		reduceGameState,
		createIdleGameState(),
	)
	const loadControllerRef = useRef<AbortController | null>(null)

	const sessionPool = useMemo(
		() => (gameData ? toSessionCountryPool(gameData) : null),
		[gameData],
	)

	const reloadGameData = useCallback(async () => {
		loadControllerRef.current?.abort()

		const controller = new AbortController()
		loadControllerRef.current = controller

		setIsLoading(true)
		setLoadErrorCode(null)

		try {
			const loaded = await loadGameData(controller.signal)
			if (controller.signal.aborted) {
				return
			}

			if (loaded.countryIds.length === 0) {
				setLoadErrorCode('no_playable_countries')
				setGameData(null)
				return
			}

			setGameData(loaded)
		} catch (error) {
			if ((error as { name?: string })?.name === 'AbortError') {
				return
			}

			if (loadControllerRef.current !== controller) {
				return
			}

			setGameData(null)
			setLoadErrorCode('load_failed')
		} finally {
			if (loadControllerRef.current === controller) {
				loadControllerRef.current = null
				setIsLoading(false)
			}
		}
	}, [])

	useEffect(() => {
		void reloadGameData()

		return () => {
			loadControllerRef.current?.abort()
			loadControllerRef.current = null
		}
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
			setEligibleIds(result.value.eligibleIds)
			dispatchEngineState({
				type: 'START',
				session: result.value,
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
