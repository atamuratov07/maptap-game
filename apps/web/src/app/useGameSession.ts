import {
	countryCatalog,
	playableCountryPool,
	type GameData,
} from '@maptap/country-catalog'
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
	useReducer,
	useState,
} from 'react'

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

const gameData: GameData | null =
	countryCatalog.countryIds.length > 0 ? countryCatalog : null

export function useGameSession(config: GameConfig): UseGameSessionResult {
	const [eligibleIds, setEligibleIds] = useState<string[]>([])
	const [loadErrorCode, setLoadErrorCode] = useState<GameLoadErrorCode | null>(
		gameData ? null : 'no_playable_countries',
	)

	const [engineState, dispatchEngineState] = useReducer(
		reduceGameState,
		createIdleGameState(),
	)

	const prepareAndStartGame = useCallback(
		(nextConfig: GameConfig) => {
			if (!gameData) {
				setLoadErrorCode('no_playable_countries')
				return
			}

			const result = prepareGameSession(playableCountryPool, nextConfig)
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
		[gameData],
	)

	const reloadGameData = useCallback(async () => {
		prepareAndStartGame(config)
	}, [config, prepareAndStartGame])

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
			if (!gameData?.countriesById.has(countryId)) {
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
		isLoading: false,
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
