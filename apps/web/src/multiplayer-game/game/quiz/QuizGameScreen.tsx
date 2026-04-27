import type {
	GameView,
	PlayerAnswer,
	QuizChoiceQuestion,
} from '@maptap/game-domain/multiplayer-next/game'
import type { VisibleMemberInfo } from '@maptap/game-domain/multiplayer-next/room'
import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import { useMemo } from 'react'
import { ScoreBanner } from '../../../shared/widgets/ScoreBanner'
import { cn } from '../../../shared/utils'
import { getLeaderboardEntries } from '../../model/gameSelectors'
import { QUIZ_PACK_OPTIONS } from '../../model/gameConfig'
import { RoomLeaderboardOverlay } from '../country-map/LeaderboardOverlay'
import { useCountdown } from '../hooks/useCountdown'

const CHOICE_LABELS = ['A', 'B', 'C', 'D'] as const
const URGENT_COUNTDOWN_SECONDS = 5

interface QuizGameScreenProps {
	game: GameView
	members: VisibleMemberInfo[]
	submitPending: boolean
	actionErrorMessage: string | null
	isReconnecting: boolean
	onSubmitAnswer: (answer: PlayerAnswer) => Promise<void>
}

function formatCountdown(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60

	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function QuizTimer({ deadlineAt }: { deadlineAt: number | null }): JSX.Element {
	const secondsLeft = useCountdown(deadlineAt)
	const isUrgent = secondsLeft <= URGENT_COUNTDOWN_SECONDS
	const shouldPulse = deadlineAt !== null && isUrgent

	return (
		<div
			key={deadlineAt === null ? 'idle' : shouldPulse ? secondsLeft : 'normal'}
			className={cn(
				'grid h-14 min-w-22 place-items-center rounded-full px-4 text-center font-black tabular-nums shadow-lg',
				deadlineAt === null
					? 'bg-white/12 text-slate-300'
					: shouldPulse
						? 'countdown-badge-bump bg-red-600 text-white shadow-[0_0_14px_rgba(220,38,38,0.8)]'
						: 'bg-amber-400 text-slate-950',
			)}
		>
			<p className='text-base'>
				<span
					key={secondsLeft}
					className={cn('inline-block', shouldPulse && 'countdown-time-bump')}
				>
					{deadlineAt === null ? '--:--' : formatCountdown(secondsLeft)}
				</span>
			</p>
		</div>
	)
}

function getSelectedChoiceId(game: GameView): string | null {
	if (game.phase === 'completed') {
		return null
	}

	const answer = game.viewerSubmission?.answer
	return answer?.kind === 'choice_id' ? answer.choiceId : null
}

function ChoiceIcon({
	isSelected,
	isCorrect,
	isWrong,
}: {
	isSelected: boolean
	isCorrect: boolean
	isWrong: boolean
}): JSX.Element {
	if (isCorrect) {
		return <CheckCircle2 aria-hidden='true' size={22} strokeWidth={2.5} />
	}

	if (isWrong) {
		return <XCircle aria-hidden='true' size={22} strokeWidth={2.5} />
	}

	return isSelected ? (
		<CheckCircle2 aria-hidden='true' size={22} strokeWidth={2.5} />
	) : (
		<Circle aria-hidden='true' size={22} strokeWidth={2.5} />
	)
}

function QuizQuestionImage({
	question,
}: {
	question: QuizChoiceQuestion
}): JSX.Element | null {
	if (!question.imageUrl) {
		return null
	}

	return (
		<img
			src={question.imageUrl}
			alt={question.imageAlt ?? ''}
			className='mt-6 max-h-64 w-full max-w-2xl object-contain sm:max-h-80'
			decoding='async'
		/>
	)
}

export function QuizGameScreen({
	game,
	members,
	submitPending,
	actionErrorMessage,
	isReconnecting,
	onSubmitAnswer,
}: QuizGameScreenProps): JSX.Element {
	const leaderboardEntries = useMemo(
		() => getLeaderboardEntries(game, members, 5),
		[game, members],
	)

	if (game.phase === 'completed') {
		return (
			<main className='grid h-full place-items-center bg-slate-950 px-5 py-8 text-white'>
				<p className='text-sm font-semibold text-slate-300'>
					Завершаем игру...
				</p>
			</main>
		)
	}

	if (game.question.kind !== 'quiz_choice') {
		return (
			<main className='grid h-full place-items-center bg-slate-950 px-5 py-8 text-white'>
				<p className='text-sm font-semibold text-slate-300'>
					Этот вопрос недоступен в режиме викторины.
				</p>
			</main>
		)
	}

	const question: QuizChoiceQuestion = game.question
	const selectedChoiceId = getSelectedChoiceId(game)
	const isOpen = game.phase === 'open'
	const isRevealed = game.phase === 'revealed' || game.phase === 'leaderboard'
	const evaluatedSubmission = isOpen ? null : game.viewerSubmission
	const awardedScore = evaluatedSubmission?.scoreAwarded ?? 0
	const isCorrect =
		evaluatedSubmission && evaluatedSubmission.answer !== null
			? evaluatedSubmission.isCorrect
			: null
	const scoreBannerTriggerKey =
		game.phase === 'revealed' ? game.revealedAt : null
	const packLabel =
		QUIZ_PACK_OPTIONS.find(option => option.value === game.quizPackId)
			?.label ?? 'Викторина'

	return (
		<section className='relative flex h-full min-h-0 flex-col overflow-hidden bg-slate-950 text-white'>
			<main className='relative min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6'>
				<div className='mx-auto w-full max-w-4xl'>
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<div className='rounded-full bg-white/10 px-4 py-3'>
							<p className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400'>
								Раунд
							</p>
							<p className='text-sm font-black'>
								{game.currentQuestionNumber} / {game.questionCount}
							</p>
						</div>
						<QuizTimer deadlineAt={isOpen ? game.deadlineAt : null} />
					</div>

					<div className='mt-8'>
						<p className='text-[11px] font-black uppercase tracking-[0.24em] text-amber-300'>
							{packLabel}
						</p>
						<h1 className='mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl'>
							{question.prompt}
						</h1>
						<QuizQuestionImage question={question} />
					</div>

					<div className='mt-12 grid gap-3 sm:mt-14 sm:grid-cols-2'>
						{question.choices.map((choice, index) => {
							const isSelected = selectedChoiceId === choice.id
							const isCorrectChoice =
								isRevealed && choice.id === question.correctChoiceId
							const isWrongSelected =
								isRevealed && isSelected && !isCorrectChoice
							const disabled = !isOpen || Boolean(selectedChoiceId) || submitPending

							return (
								<button
									key={choice.id}
									type='button'
									disabled={disabled}
									className={cn(
										'flex min-h-20 items-center gap-4 rounded-2xl border px-4 py-4 text-left transition',
										'disabled:cursor-default',
										isCorrectChoice
											? 'border-emerald-300 bg-emerald-400/18 text-emerald-50'
											: isWrongSelected
												? 'border-rose-300 bg-rose-500/18 text-rose-50'
												: isSelected
													? 'border-amber-300 bg-amber-400/18 text-amber-50'
													: 'border-white/12 bg-white/8 text-white hover:border-amber-300/70 hover:bg-white/12',
									)}
									onClick={() => {
										void onSubmitAnswer({
											kind: 'choice_id',
											choiceId: choice.id,
										})
									}}
								>
									<span className='grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/12 text-sm font-black'>
										{CHOICE_LABELS[index] ?? index + 1}
									</span>
									<span className='min-w-0 flex-1 text-lg font-black leading-snug'>
										{choice.label}
									</span>
									<span
										className={cn(
											'shrink-0',
											isCorrectChoice
												? 'text-emerald-200'
												: isWrongSelected
													? 'text-rose-200'
													: 'text-slate-300',
										)}
									>
										<ChoiceIcon
											isSelected={isSelected}
											isCorrect={isCorrectChoice}
											isWrong={isWrongSelected}
										/>
									</span>
								</button>
							)
						})}
					</div>

					<div className='mt-6 min-h-8'>
						{isReconnecting ? (
							<p className='rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200'>
								Переподключаемся к комнате...
							</p>
						) : actionErrorMessage ? (
							<p className='rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white'>
								{actionErrorMessage}
							</p>
						) : selectedChoiceId && isOpen ? (
							<p className='rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-slate-200'>
								Ответ принят
							</p>
						) : null}
					</div>
				</div>
			</main>

			<ScoreBanner
				triggerKey={scoreBannerTriggerKey}
				isCorrect={isCorrect}
				totalScore={game.viewerScore}
				awardedScore={awardedScore}
				className='top-10'
				shadowClassName='bg-slate-950/95'
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
