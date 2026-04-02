import type { CountryInfo } from '@maptap/country-catalog'
import {
	getAttemptsLeft,
	getQuestionCount,
	getQuestionIndex,
	getQuestionResolvedAt,
	getQuestionStartedAt,
	getRevealedId,
	getTargetId,
	getWrongPicks,
	isPickAllowed,
	type GameState,
} from '@maptap/game-domain/singleplayer'
import { useMemo } from 'react'
import { MapLibreRenderer } from '../renderer/MapLibreRenderer'
import type { MapRendererProps } from '../renderer/types'
import { CountryInfoCard } from './CountryInfoCard'
import { HeaderBar } from './HeaderBar'
import { Hearts } from './Hearts'

interface GameScreenProps {
	state: GameState
	eligibleIds: string[]
	countriesInfo: Map<string, CountryInfo>
	onPick: (countryId: string) => void
	onGiveUp: () => void
	onNext: () => void
}

export function GameScreen({
	state,
	eligibleIds,
	countriesInfo,
	onPick,
	onGiveUp,
	onNext,
}: GameScreenProps): JSX.Element {
	const targetId = getTargetId(state)
	const targetInfo = targetId ? countriesInfo.get(targetId) : undefined
	const revealedId = getRevealedId(state)
	const wrongPicks = getWrongPicks(state)
	const questionCount = getQuestionCount(state)
	const questionIndex = getQuestionIndex(state)
	const questionStartedAt = getQuestionStartedAt(state)
	const questionResolvedAt = getQuestionResolvedAt(state)
	const attemptsLeft = getAttemptsLeft(state)

	const revealedInfo = useMemo<MapRendererProps['revealedInfo']>(() => {
		if (!revealedId) {
			return null
		}

		const info = countriesInfo.get(revealedId)
		if (!info) {
			return null
		}

		return {
			countryId: revealedId,
			longitude: info.centroidLng,
			latitude: info.centroidLat,
			element: <CountryInfoCard info={info} />,
		}
	}, [countriesInfo, revealedId])

	const interactiveIds = useMemo<ReadonlySet<string>>(
		() => new Set(eligibleIds),
		[eligibleIds],
	)

	const canPick = isPickAllowed(state)
	const progressLabel = questionCount
		? `Вопрос ${Math.min(questionIndex + 1, questionCount)} / ${questionCount}`
		: 'Нет вопросов'

	const rendererProps: MapRendererProps = {
		onPick: canPick ? onPick : () => undefined,
		interactiveIds,
		scope: state.config.scope,
		wrongIds: wrongPicks,
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
				questionStartedAt={questionStartedAt}
				questionResolvedAt={questionResolvedAt}
				canGiveUp={state.phase === 'playing'}
				onGiveUp={onGiveUp}
			/>

			<main className='relative h-screen'>
				<div className='h-full w-full'>
					<MapLibreRenderer {...rendererProps} />
				</div>

				{showHearts ? (
					<div className='absolute right-5 bottom-5 z-20'>
						<Hearts
							attemptsLeft={attemptsLeft}
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
