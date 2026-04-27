import type {
	GameView,
	PlayerAnswer,
} from '@maptap/game-domain/multiplayer-next/game'
import { useCallback, useMemo } from 'react'
import type { MapHighlight, MapRendererProps } from '../../../shared/map/types'
import { CountryInfoCard } from '../../../shared/widgets/CountryInfoCard'
import {
	getCorrectCountryInfo,
	getCountryInfo,
} from '../../model/gameSelectors'
import { SelectedAnswerMarker } from './SelectedAnswerMarker'

const EMPTY_HIGHLIGHTS: readonly MapHighlight[] = []
const EMPTY_MARKERS: NonNullable<MapRendererProps['markers']> = []
const noopPick = () => undefined

interface UseRoomGameMapArgs {
	game: GameView
	submitPending: boolean
	onSubmitAnswer: (answer: PlayerAnswer) => void
}

interface UseRoomGameMapResult {
	mapProps: MapRendererProps
}

export function useGameMap({
	game,
	submitPending,
	onSubmitAnswer,
}: UseRoomGameMapArgs): UseRoomGameMapResult {
	const interactiveIds = useMemo<ReadonlySet<string>>(
		() => new Set(game.eligibleCountryIds),
		[game.eligibleCountryIds],
	)

	const isCompleted = game.phase === 'completed'
	const isOpen = game.phase === 'open'
	const correctCountryId =
		game.phase === 'revealed' || game.phase === 'leaderboard'
			? game.correctCountryId
			: null
	const submissionCountryId =
		game.phase === 'completed'
			? null
			: (game.viewerSubmission?.countryId ?? null)

	const correctCountryInfo = getCorrectCountryInfo(game)
	const selectedCountryInfo = getCountryInfo(submissionCountryId)

	const handlePick = useCallback(
		(countryId: string) => {
			void onSubmitAnswer({
				kind: 'country_id',
				countryId,
			})
		},
		[onSubmitAnswer],
	)

	const resetViewKey =
		game.phase !== 'completed'
			? `${game.currentQuestionNumber}:${game.startedAt}`
			: null

	const mapProps = useMemo<MapRendererProps>(() => {
		if (isCompleted) {
			return {
				onPick: noopPick,
				interactiveIds,
				scope: game.scope,
				highlights: EMPTY_HIGHLIGHTS,
				markers: EMPTY_MARKERS,
				popup: null,
				disabled: true,
				resetViewKey,
			}
		}

		if (isOpen) {
			return {
				onPick: handlePick,
				interactiveIds,
				scope: game.scope,
				highlights: submissionCountryId
					? [
							{
								countryId: submissionCountryId,
								tone: 'selected',
							},
						]
					: EMPTY_HIGHLIGHTS,
				markers:
					submissionCountryId && selectedCountryInfo
						? [
								{
									id: `selected-${submissionCountryId}`,
									longitude: selectedCountryInfo.centroidLng,
									latitude: selectedCountryInfo.centroidLat,
									element: <SelectedAnswerMarker />,
								},
							]
						: EMPTY_MARKERS,
				popup: null,
				disabled: Boolean(submissionCountryId) || submitPending,
				resetViewKey,
			}
		}

		const highlights: NonNullable<MapHighlight[]> = []
		if (correctCountryId) {
			highlights.push({
				countryId: correctCountryId,
				tone: 'correct',
			})
		}

		if (submissionCountryId && submissionCountryId !== correctCountryId) {
			highlights.push({
				countryId: submissionCountryId,
				tone: 'wrong',
			})
		}

		return {
			onPick: noopPick,
			interactiveIds,
			scope: game.scope,
			highlights,
			markers: EMPTY_MARKERS,
			popup: correctCountryInfo
				? {
						countryId: correctCountryInfo.id,
						longitude: correctCountryInfo.centroidLng,
						latitude: correctCountryInfo.centroidLat,
						element: <CountryInfoCard info={correctCountryInfo} />,
					}
				: null,
			disabled: true,
			resetViewKey,
		}
	}, [
		correctCountryId,
		correctCountryInfo,
		game.scope,
		handlePick,
		isCompleted,
		interactiveIds,
		isOpen,
		resetViewKey,
		selectedCountryInfo,
		submissionCountryId,
		submitPending,
	])

	return {
		mapProps,
	}
}
