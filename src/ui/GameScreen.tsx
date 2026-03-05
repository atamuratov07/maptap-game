import { useMemo } from 'react'
import { getTargetId, isPickAllowed } from '../core/engine'
import type { GameState, RendererKind } from '../core/types'
import type { CountryFeature, CountryInfo } from '../data/types'
import { MapboxGlobeRenderer } from '../renderers/MapboxRenderer/MapboxGlobeRenderer'
import { SvgMapRenderer } from '../renderers/SvgMapRenderer/SvgMapRenderer'
import type { MapRendererProps } from '../renderers/types'
import { CountryInfoCard } from './CountryInfoCard'
import { HeaderBar } from './HeaderBar'
import { Hearts } from './Hearts'

interface GameScreenProps {
	state: GameState
	features: CountryFeature[]
	infoMap: Map<string, CountryInfo>
	rendererKind: RendererKind
	mapboxToken?: string
	onPick: (countryId: string) => void
	onGiveUp: () => void
	onNext: () => void
	onMapboxUnavailable: () => void
}

export function GameScreen({
	state,
	features,
	infoMap,
	rendererKind,
	mapboxToken,
	onPick,
	onGiveUp,
	onNext,
	onMapboxUnavailable,
}: GameScreenProps): JSX.Element {
	const targetId = getTargetId(state)
	const targetInfo = targetId ? infoMap.get(targetId) : undefined

	const wrongChoiceLabels = useMemo(
		() =>
			state.wrongPicks.map(id => ({
				countryId: id,
				label: infoMap.get(id)?.name || id,
			})),
		[infoMap, state.wrongPicks],
	)
	const highlighted = useMemo<MapRendererProps['highlighted']>(() => {
		if (state.phase === 'playing') {
			return {
				wrongIds: state.wrongPicks,
			}
		}

		if (state.phase === 'revealed') {
			return {
				revealedId: state.revealedId,
				wrongIds: state.wrongPicks,
			}
		}

		return {
			wrongIds: [],
		}
	}, [state.phase, state.revealedId, state.wrongPicks])

	const pinned = useMemo<MapRendererProps['pinned']>(() => {
		if (state.phase !== 'revealed' || !state.revealedId) {
			return null
		}

		const info = infoMap.get(state.revealedId)
		if (!info) {
			return null
		}

		return {
			countryId: state.revealedId,
			element: <CountryInfoCard info={info} />,
		}
	}, [infoMap, state.phase, state.revealedId])

	const canPick = isPickAllowed(state)
	const progressLabel = state.questionIds.length
		? `Question ${Math.min(state.index + 1, state.questionIds.length)} / ${state.questionIds.length}`
		: 'No questions'

	const commonRendererProps: MapRendererProps = {
		features,
		onPick: canPick ? onPick : () => undefined,
		highlighted,
		wrongChoiceLabels,
		pinned,
		disabled: !canPick,
	}

	const useMapboxRenderer = rendererKind === 'mapbox' && Boolean(mapboxToken)
	const showHearts = state.phase === 'playing' || state.phase === 'revealed'

	return (
		<section className='min-h-screen'>
			<HeaderBar
				progressLabel={progressLabel}
				targetName={targetInfo?.name || 'Game complete'}
				targetFlagUrl={targetInfo?.flagUrl}
				phase={state.phase}
				questionStartedAt={state.questionStartedAt}
				questionResolvedAt={state.questionResolvedAt}
				canGiveUp={state.phase === 'playing'}
				onGiveUp={onGiveUp}
			/>

			<main className='relative h-screen'>
				<div className='h-full w-full'>
					{useMapboxRenderer ? (
						<MapboxGlobeRenderer
							{...commonRendererProps}
							token={mapboxToken as string}
							onCriticalError={onMapboxUnavailable}
						/>
					) : (
						<SvgMapRenderer {...commonRendererProps} />
					)}
				</div>

				{showHearts ? (
					<div className='absolute right-5 bottom-5 z-20'>
						<Hearts
							attemptsLeft={state.attemptsLeft}
							maxAttempts={state.config.attemptsPerQuestion}
						/>
					</div>
				) : null}

				{state.phase === 'revealed' ? (
					<div className='absolute bottom-5 left-1/2 z-20 -translate-x-1/2'>
						<button
							type='button'
							className='rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(14,165,233,0.35)] transition hover:-translate-y-0.5 hover:bg-sky-400'
							onClick={onNext}
						>
							Next Question
						</button>
					</div>
				) : null}
			</main>
		</section>
	)
}
