import { useMemo } from 'react'
import {
	getTargetId,
	isPickAllowed,
	type GameState,
	type RendererKind,
} from '../core/engine'
import type { CountryFeature, CountryInfo } from '../data/types'
import { MapboxGlobeRenderer } from '../renderers/MapboxGlobeRenderer'
import { SvgMapRenderer } from '../renderers/SvgMapRenderer'
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
	elapsedSeconds: number
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
	elapsedSeconds,
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
		? `Вопрос ${Math.min(state.index + 1, state.questionIds.length)} / ${state.questionIds.length}`
		: 'Нет вопросов'

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
		<section className='game-screen'>
			<HeaderBar
				progressLabel={progressLabel}
				targetName={targetInfo?.name || 'Игра завершена'}
				targetFlagUrl={targetInfo?.flagUrl}
				elapsedSeconds={elapsedSeconds}
				canGiveUp={state.phase === 'playing'}
				onGiveUp={onGiveUp}
			/>

			<main className='map-area'>
				<div className='renderer-shell'>
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
					<div className='hearts-anchor'>
						<Hearts
							attemptsLeft={state.attemptsLeft}
							maxAttempts={state.config.attemptsPerQuestion}
						/>
					</div>
				) : null}

				{state.phase === 'revealed' ? (
					<div className='next-button-row'>
						<button
							type='button'
							className='next-button'
							onClick={onNext}
						>
							Следующий вопрос
						</button>
					</div>
				) : null}
			</main>
		</section>
	)
}
