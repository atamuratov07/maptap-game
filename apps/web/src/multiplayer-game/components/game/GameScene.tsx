import type { EvaluatedViewerSubmissionState } from '@maptap/game-domain/multiplayer'
import { MapRenderer } from '../../../shared/map/MapRenderer'
import {
	getLeaderboard,
	getViewerLeaderboardEntry,
	getViewerPlayer,
	type MultiplayerRoomView,
} from '../../core/roomView'
import { useCountdown } from '../../core/useCountdown'
import { useTimestampGate } from '../../core/useTimestampGate'
import { GameHeader } from './GameHeader'
import { RoomLeaderboardOverlay } from './LeaderboardOverlay'
import { RoomScoreBanner } from './ScoreBanner'
import { useGameMap } from './useGameMap'

const LEADERBOARD_LIST_DELAY_MS = 1200
const SCORE_BANNER_DELAY_MS = 1200

interface RoomGameSceneProps {
	room: MultiplayerRoomView
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

export function GameScene({
	room,
	submitPending,
	actionErrorMessage,
	isReconnecting,
	onSubmitAnswer,
}: RoomGameSceneProps): JSX.Element {
	const round = room.currentRound
	const { mapProps, promptCountryInfo, correctCountryInfo } = useGameMap({
		room,
		submitPending,
		onSubmitAnswer,
	})
	const viewer = getViewerPlayer(room)
	const viewerLeaderboardEntry = getViewerLeaderboardEntry(room)
	const secondsLeft = useCountdown(
		round?.phase === 'open' ? round.deadlineAt : null,
	)
	const revealStartedAt =
		round && round.phase !== 'open' ? round.revealedAt : null
	const leaderboardStartedAt =
		round?.phase === 'leaderboard' ? round.leaderboardShownAt : null
	const showScoreBanner = useTimestampGate(
		revealStartedAt,
		SCORE_BANNER_DELAY_MS,
	)
	const showLeaderboardList = useTimestampGate(
		leaderboardStartedAt,
		LEADERBOARD_LIST_DELAY_MS,
	)

	if (!round) {
		return (
			<main className='grid min-h-screen place-items-center bg-slate-950 px-5 py-8 text-white'>
				<p className='text-sm font-semibold text-slate-300'>
					Загружаем раунд...
				</p>
			</main>
		)
	}

	const targetInfo =
		round.phase === 'open' ? promptCountryInfo : correctCountryInfo
	const viewerScore = viewerLeaderboardEntry?.score ?? viewer?.score ?? null
	const viewerRank = viewerLeaderboardEntry?.rank ?? viewer?.rank ?? null
	const evaluatedSubmission =
		round.phase === 'open'
			? null
			: (round.submission as EvaluatedViewerSubmissionState | null)

	return (
		<section className='flex h-full flex-col overflow-hidden bg-slate-950 text-white'>
			<GameHeader
				progressLabel={`${room.currentQuestionNumber} / ${room.questionCount}`}
				targetLabel={
					round.phase === 'open' ? 'Найдите страну' : 'Правильный ответ'
				}
				targetName={targetInfo?.nameRu || targetInfo?.name || 'Страна'}
				targetFlagUrl={targetInfo?.flagUrl}
				viewerName={viewer?.name ?? 'Игрок'}
				viewerScore={viewerScore}
				viewerRank={viewerRank}
				secondsLeft={round.phase === 'open' ? secondsLeft : null}
			/>
			<main className='relative min-h-0 flex-1'>
				<MapRenderer {...mapProps} />
			</main>

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

			{showScoreBanner ? (
				<div className='absolute inset-0 z-10 animate-[room-backdrop-fade_240ms_ease-out_both] bg-slate-950/56 backdrop-blur-[2px]' />
			) : null}

			{showScoreBanner ? (
				<RoomScoreBanner
					submission={evaluatedSubmission}
					viewerScore={viewerScore}
				/>
			) : null}

			{round.phase === 'leaderboard' && showLeaderboardList ? (
				<RoomLeaderboardOverlay
					entries={getLeaderboard(room)}
					viewerPlayerId={room.viewerPlayerId}
				/>
			) : null}
		</section>
	)
}
