import type { GameView } from '@maptap/game-domain/multiplayer-next/game'
import type { VisibleMemberInfo } from '@maptap/game-domain/multiplayer-next/room'
import { useMemo } from 'react'
import { MapRenderer } from '../../../shared/map/MapRenderer'
import { ScoreBanner } from '../../../shared/widgets/ScoreBanner'
import {
	getCurrentRound,
	getLeaderboardEntries,
	getTargetCountryInfo,
} from '../../model/gameSelectors'
import { GameQuestionBar } from './GameQuestionBar'
import { RoomLeaderboardOverlay } from './LeaderboardOverlay'
import { useGameMap } from './useGameMap'

interface CountryMapGameScreenProps {
	game: GameView
	members: VisibleMemberInfo[]
	submitPending: boolean
	actionErrorMessage: string | null
	isReconnecting: boolean
	onSubmitAnswer: (countryId: string) => Promise<void>
}

function FloatingNotice({
	message,
	tone = 'neutral',
	offsetClassName = 'top-[5.25rem]',
}: {
	message: string
	tone?: 'neutral' | 'error'
	offsetClassName?: string
}): JSX.Element {
	return (
		<div
			className={`absolute inset-x-0 ${offsetClassName} z-40 flex justify-center px-4`}
		>
			<p
				className={`rounded-full px-4 py-2 text-sm font-bold shadow-lg backdrop-blur ${tone === 'error' ? 'bg-rose-500/92 text-white' : 'bg-slate-950/80 text-slate-100'}`}
			>
				{message}
			</p>
		</div>
	)
}

export function CountryMapGameScreen({
	game,
	members,
	submitPending,
	actionErrorMessage,
	isReconnecting,
	onSubmitAnswer,
}: CountryMapGameScreenProps): JSX.Element {
	const currentRound = getCurrentRound(game)
	const { mapProps } = useGameMap({
		game,
		submitPending,
		onSubmitAnswer,
	})
	const leaderboardEntries = useMemo(
		() => getLeaderboardEntries(game, members, 5),
		[game.leaderboard, members],
	)
	const evaluatedSubmission =
		game.phase === 'open' || game.phase === 'completed'
			? null
			: game.viewerSubmission
	const scoreBannerTriggerKey =
		game.phase === 'revealed' ? game.revealedAt : null
	const awardedScore = evaluatedSubmission?.scoreAwarded ?? 0
	const isCorrect =
		evaluatedSubmission && evaluatedSubmission.countryId !== null
			? evaluatedSubmission.isCorrect
			: null
	const targetInfo = getTargetCountryInfo(game)

	if (game.phase === 'completed' || !currentRound) {
		return (
			<main className='grid h-full place-items-center bg-slate-950 px-5 py-8 text-white'>
				<p className='text-sm font-semibold text-slate-300'>
					Завершаем игру...
				</p>
			</main>
		)
	}

	return (
		<section className='flex h-full flex-col overflow-hidden bg-slate-950 text-white'>
			<main className='relative min-h-0 flex-1'>
				<MapRenderer {...mapProps} />
			</main>

			<GameQuestionBar
				progressLabel={`${currentRound.currentQuestionNumber} / ${currentRound.questionCount}`}
				questionLabel={
					game.phase === 'open' ? 'Найдите страну' : 'Правильный ответ'
				}
				targetName={targetInfo?.nameRu || targetInfo?.name || 'Страна'}
				targetFlagUrl={targetInfo?.flagUrl}
				deadlineAt={game.phase === 'open' ? currentRound.deadlineAt : null}
			/>

			{isReconnecting ? (
				<FloatingNotice message='Переподключаемся к комнате...' />
			) : null}

			{actionErrorMessage ? (
				<FloatingNotice
					message={actionErrorMessage}
					tone='error'
					offsetClassName={
						isReconnecting ? 'top-[8.5rem]' : 'top-[5.25rem]'
					}
				/>
			) : null}

			<ScoreBanner
				triggerKey={scoreBannerTriggerKey}
				isCorrect={isCorrect}
				totalScore={game.viewerScore}
				awardedScore={awardedScore}
				className='top-10'
			/>

			{game.phase === 'leaderboard' ? (
				<RoomLeaderboardOverlay
					entries={leaderboardEntries}
					viewerParticipantId={game.viewerParticipantId}
					shownAt={game.leaderboardShownAt}
				/>
			) : null}
		</section>
	)
}
