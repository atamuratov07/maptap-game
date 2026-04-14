import { countryCatalog } from '@maptap/country-catalog'
import { useMemo } from 'react'
import { CountryInfoCard } from '../../../shared/components/CountryInfoCard'
import type { MapHighlight, MapRendererProps } from '../../../shared/map/types'
import type { MultiplayerRoomView } from '../../core/roomView'
import { getCountryInfo } from '../../core/roomView'
import { SelectedAnswerMarker } from './SelectedAnswerMarker'

interface UseRoomGameMapArgs {
	room: MultiplayerRoomView
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
	const allCountryIds = useMemo<ReadonlySet<string>>(
		() => new Set(countryCatalog.countryIds),
		[],
	)

	const round = room.currentRound
	const promptCountryInfo = getCountryInfo(
		round?.phase === 'open' ? round.questionCountryId : null,
	)
	const correctCountryInfo = getCountryInfo(
		round?.phase === 'open' ? null : round?.correctCountryId,
	)
	const selectedCountryInfo = getCountryInfo(round?.submission?.countryId)

	const mapProps = useMemo<MapRendererProps>(() => {
		if (!round) {
			return {
				onPick: () => undefined,
				interactiveIds: allCountryIds,
				scope: room.scope,
				highlights: [],
				markers: [],
				popup: null,
				disabled: true,
			}
		}

		if (round.phase === 'open') {
			return {
				onPick: countryId => {
					void onSubmitAnswer(countryId)
				},
				interactiveIds: allCountryIds,
				scope: room.scope,
				highlights: round.submission?.countryId
					? [
							{
								countryId: round.submission.countryId,
								tone: 'selected',
							},
						]
					: [],
				markers:
					round.submission?.countryId && selectedCountryInfo
						? [
								{
									id: `selected-${round.submission.countryId}`,
									longitude: selectedCountryInfo.centroidLng,
									latitude: selectedCountryInfo.centroidLat,
									element: <SelectedAnswerMarker />,
								},
							]
						: [],
				popup: null,
				disabled: Boolean(round.submission?.countryId) || submitPending,
			}
		}

		const highlights: NonNullable<MapHighlight[]> = []
		if (round.correctCountryId) {
			highlights.push({
				countryId: round.correctCountryId,
				tone: 'correct',
			})
		}

		if (
			round.submission?.countryId &&
			round.submission.countryId !== round.correctCountryId
		) {
			highlights.push({
				countryId: round.submission.countryId,
				tone: 'wrong',
			})
		}

		return {
			onPick: () => undefined,
			interactiveIds: allCountryIds,
			scope: room.scope,
			highlights: highlights,
			markers: [],
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
		allCountryIds,
		correctCountryInfo,
		onSubmitAnswer,
		room.scope,
		round,
		selectedCountryInfo,
		submitPending,
	])

	return {
		mapProps,
		promptCountryInfo,
		correctCountryInfo,
		selectedCountryInfo,
	}
}
