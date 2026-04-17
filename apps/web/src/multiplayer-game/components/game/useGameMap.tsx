import type { RoomView } from '@maptap/game-domain/multiplayer'
import { useCallback, useMemo } from 'react'
import { CountryInfoCard } from '../../../shared/components/CountryInfoCard'
import type { MapHighlight, MapRendererProps } from '../../../shared/map/types'
import { getCountryInfo } from '../../core/roomView'
import { SelectedAnswerMarker } from './SelectedAnswerMarker'

const EMPTY_HIGHLIGHTS: readonly MapHighlight[] = []
const EMPTY_MARKERS: NonNullable<MapRendererProps['markers']> = []
const noopPick = () => undefined

interface UseRoomGameMapArgs {
	room: RoomView
	submitPending: boolean
	onSubmitAnswer: (countryId: string) => void
}

interface UseRoomGameMapResult {
	mapProps: MapRendererProps
	promptCountryInfo: ReturnType<typeof getCountryInfo>
	correctCountryInfo: ReturnType<typeof getCountryInfo>
	selectedCountryInfo: ReturnType<typeof getCountryInfo>
}

export function useGameMap({
	room,
	submitPending,
	onSubmitAnswer,
}: UseRoomGameMapArgs): UseRoomGameMapResult {
	const eligibleCountryIdsKey = room.eligibleCountryIds.join('|')
	const interactiveIds = useMemo<ReadonlySet<string>>(
		() => new Set(room.eligibleCountryIds),
		// Room snapshots recreate arrays; the country pool itself is stable for
		// the room, so key by contents instead of array identity.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[eligibleCountryIdsKey],
	)

	const round = room.currentRound
	const hasRound = Boolean(round)
	const isRoundOpen = round?.phase === 'open'
	const openQuestionCountryId =
		round?.phase === 'open' ? round.questionCountryId : null
	const correctCountryId =
		round && round.phase !== 'open' ? round.correctCountryId : null
	const submissionCountryId = round?.submission?.countryId ?? null

	const promptCountryInfo = getCountryInfo(openQuestionCountryId)
	const correctCountryInfo = getCountryInfo(correctCountryId)
	const selectedCountryInfo = getCountryInfo(submissionCountryId)

	const handlePick = useCallback(
		(countryId: string) => {
			void onSubmitAnswer(countryId)
		},
		[onSubmitAnswer],
	)

	const mapProps = useMemo<MapRendererProps>(() => {
		if (!hasRound) {
			return {
				onPick: noopPick,
				interactiveIds,
				scope: room.scope,
				highlights: EMPTY_HIGHLIGHTS,
				markers: EMPTY_MARKERS,
				popup: null,
				disabled: true,
			}
		}

		if (isRoundOpen) {
			return {
				onPick: handlePick,
				interactiveIds,
				scope: room.scope,
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
			}
		}

		const highlights: NonNullable<MapHighlight[]> = []
		if (correctCountryId) {
			highlights.push({
				countryId: correctCountryId,
				tone: 'correct',
			})
		}

		if (
			submissionCountryId &&
			submissionCountryId !== correctCountryId
		) {
			highlights.push({
				countryId: submissionCountryId,
				tone: 'wrong',
			})
		}

		return {
			onPick: noopPick,
			interactiveIds,
			scope: room.scope,
			highlights: highlights,
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
		}
	}, [
		correctCountryId,
		hasRound,
		interactiveIds,
		handlePick,
		correctCountryInfo,
		isRoundOpen,
		room.scope,
		selectedCountryInfo,
		submissionCountryId,
		submitPending,
	])

	return {
		mapProps,
		promptCountryInfo,
		correctCountryInfo,
		selectedCountryInfo,
	}
}
