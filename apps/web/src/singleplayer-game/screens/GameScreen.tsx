import type { CountryInfo } from '@maptap/country-catalog'
import {
	getAttemptsLeft,
	getIsCorrect,
	getQuestionCount,
	getQuestionIndex,
	getQuestionResolvedAt,
	getQuestionStartedAt,
	getRevealedId,
	getScore,
	getTargetId,
	getWrongPicks,
	isPickAllowed,
	type GameState,
} from '@maptap/game-domain/singleplayer'
import { useEffect, useMemo, useRef } from 'react'
import { CountryInfoCard } from '../../shared/components/CountryInfoCard'
import { MapRenderer } from '../../shared/map/MapRenderer'
import type { MapHighlightTone, MapRendererProps } from '../../shared/map/types'
import { GameHeader } from '../components/GameHeader'
import { Hearts } from '../components/Hearts'
import { ScoreBanner } from '../components/ScoreBanner'

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
	const totalScore = getScore(state)
	const isCorrect = getIsCorrect(state)
	const previousScoreRef = useRef(totalScore)

	const popup = useMemo<MapRendererProps['popup']>(() => {
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

	const highlights = useMemo<MapRendererProps['highlights']>(() => {
		const nextHighlights = wrongPicks.map(countryId => ({
			countryId,
			tone: 'wrong' as MapHighlightTone,
		}))

		if (revealedId) {
			nextHighlights.push({
				countryId: revealedId,
				tone: 'correct',
			})
		}

		return nextHighlights
	}, [revealedId, wrongPicks])

	const canPick = isPickAllowed(state)
	const scoreAwarded = totalScore - previousScoreRef.current

	const rendererProps: MapRendererProps = {
		onPick: canPick ? onPick : () => undefined,
		interactiveIds,
		scope: state.config.scope,
		highlights: highlights,
		popup,
		disabled: !canPick,
	}

	const showHearts = state.phase === 'playing' || state.phase === 'revealed'

	useEffect(() => {
		if (state.phase === 'revealed') {
			return
		}
		previousScoreRef.current = totalScore
	}, [state.phase, totalScore])

	return (
		<section className='flex h-full flex-col overflow-hidden'>
			<GameHeader
				questionIndex={questionIndex}
				questionCount={questionCount}
				targetName={
					targetInfo?.nameRu || targetInfo?.name || 'Игра завершена'
				}
				targetFlagUrl={targetInfo?.flagUrl}
				isPlaying={state.phase === 'playing'}
				questionStartedAt={questionStartedAt}
				questionResolvedAt={questionResolvedAt}
				onGiveUp={onGiveUp}
			/>

			<main className='relative min-h-0 flex-1'>
				<MapRenderer {...rendererProps} />

				<ScoreBanner
					triggerKey={questionResolvedAt}
					isCorrect={isCorrect}
					totalScore={totalScore}
					awardedScore={scoreAwarded}
				/>

				{showHearts ? (
					<div className='absolute right-5 top-3 z-20'>
						<Hearts
							attemptsLeft={attemptsLeft}
							maxAttempts={state.config.attemptsPerQuestion}
						/>
					</div>
				) : null}

				{state.phase === 'revealed' ? (
					<div className='absolute bottom-8 left-1/2 z-20 -translate-x-1/2'>
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
