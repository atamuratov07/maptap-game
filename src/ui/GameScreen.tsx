import { useMemo } from 'react'
import { getTargetId, isPickAllowed } from '../core/engine'
import type { GameState } from '../core/types'
import type { CountryInfo } from '../data/types'
import { MapLibreRenderer } from '../renderers/MapLibreRenderer/MapLibreRenderer'
import type { MapRendererProps } from '../renderers/types'
import { CountryInfoCard } from './CountryInfoCard'
import { HeaderBar } from './HeaderBar'
import { Hearts } from './Hearts'

interface GameScreenProps {
	state: GameState
	infoMap: Map<string, CountryInfo>
	onPick: (countryId: string) => void
	onGiveUp: () => void
	onNext: () => void
}

export function GameScreen({
	state,
	infoMap,
	onPick,
	onGiveUp,
	onNext,
}: GameScreenProps): JSX.Element {
	const targetId = getTargetId(state)
	const targetInfo = targetId ? infoMap.get(targetId) : undefined

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

	const revealedInfo = useMemo<MapRendererProps['revealedInfo']>(() => {
		if (state.phase !== 'revealed' || !state.revealedId) {
			return null
		}

		const info = infoMap.get(state.revealedId)
		if (!info) {
			return null
		}

		return {
			countryId: state.revealedId,
			longitude: info.centroidLng,
			latitude: info.centroidLat,
			element: <CountryInfoCard info={info} />,
		}
	}, [infoMap, state.phase, state.revealedId])
	const playableIds = useMemo<ReadonlySet<string>>(
		() => new Set(infoMap.keys()),
		[infoMap],
	)

	const canPick = isPickAllowed(state)
	const progressLabel = state.questionIds.length
		? `Вопрос ${Math.min(state.index + 1, state.questionIds.length)} / ${state.questionIds.length}`
		: 'Нет вопросов'

	const commonRendererProps: MapRendererProps = {
		onPick: canPick ? onPick : () => undefined,
		playableIds,
		highlighted,
		revealedInfo,
		disabled: !canPick,
	}

	const showHearts = state.phase === 'playing' || state.phase === 'revealed'

	return (
		<section className='min-h-screen'>
			<HeaderBar
				progressLabel={progressLabel}
				targetName={targetInfo?.nameRu || 'Игра завершена'}
				targetFlagUrl={targetInfo?.flagUrl}
				phase={state.phase}
				questionStartedAt={state.questionStartedAt}
				questionResolvedAt={state.questionResolvedAt}
				canGiveUp={state.phase === 'playing'}
				onGiveUp={onGiveUp}
			/>

			<main className='relative h-screen'>
				<div className='h-full w-full'>
					<MapLibreRenderer {...commonRendererProps} />
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
							Следующий вопрос
						</button>
					</div>
				) : null}
			</main>
		</section>
	)
}
