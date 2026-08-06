import type { GameHostView } from '@maptap/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@maptap/game-domain/multiplayer/room'
import { AnimatePresence, motion } from 'motion/react'
import { FloatingNotice } from '../../shared/ui/FloatingNotice'
import {
	getCurrentRound,
	getHostStandings,
	getTargetCountryInfo,
	type HostParticipantStanding,
} from '../model/gameSelectors'
import { Button } from '../../shared/ui'
import { Check, HashIcon, LoaderIcon, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { animate, type ValueTransition } from 'motion'

const EASE = [0.22, 1, 0.36, 1] as const
const ROW_LAYOUT_TRANSITION = {
	duration: 0.5,
	ease: EASE,
} as ValueTransition
const SCORE_COUNT_DURATION_S = 0.6

interface ActiveGameHostScreenProps {
	game: GameHostView
	members: VisibleMemberInfo[]
	revealPending: boolean
	advancePending: boolean
	actionErrorMessage: string | null
	isReconnecting: boolean
	onRevealRound: () => Promise<void>
	onAdvanceRound: () => Promise<void>
}

function AnimatedScore({
	score,
	className,
}: {
	score: number
	className?: string
}): JSX.Element {
	const [display, setDisplay] = useState(score)
	const previousValueRef = useRef(score)

	useEffect(() => {
		if (previousValueRef.current === score) return
		const from = previousValueRef.current
		previousValueRef.current = score

		const controls = animate(from, score, {
			duration: SCORE_COUNT_DURATION_S,
			ease: EASE,
			onUpdate: latest => setDisplay(Math.round(latest)),
		})

		return () => controls.stop()
	}, [score])

	return (
		<span className={`tabular-nums ${className}`}>
			{new Intl.NumberFormat('en-US').format(display)}
		</span>
	)
}

function PlayerBadge({
	name,
	connected,
}: {
	name: string
	connected: boolean
}): JSX.Element {
	const words = name.trim().split(/\s+/)
	const initials = (
		words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]
	).toUpperCase()
	return (
		<span
			className={`relative grid h-9 w-9 place-items-center rounded-full text-lg uppercase font-regular ${
				connected
					? 'bg-yellow-200 text-blue-300'
					: 'bg-gray-100 text-gray-300'
			}`}
		>
			{initials}
			{!connected ? (
				<span className='absolute z-5 bottom-0.5 right-0.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-red-400'>
					<X className='w-2 h-2 stroke-3 text-white' />
				</span>
			) : null}
		</span>
	)
}

function AnswerProgress({
	startedAt,
	submittedAt,
}: {
	startedAt: number
	submittedAt: number | null
}) {
	return (
		<div className='flex items-center justify-end gap-2'>
			{submittedAt ? (
				<>
					<span>
						{new Date(submittedAt - startedAt)
							.toISOString()
							.slice(14, 19)}
					</span>
					<span
						aria-hidden='true'
						className='h-2.5 w-2.5 rounded-full transition-colors duration-300 bg-amber-400'
					/>
				</>
			) : (
				<span
					aria-hidden='true'
					className='h-2.5 w-2.5 rounded-full transition-colors duration-300 bg-slate-200'
				/>
			)}
		</div>
	)
}

function SubmissionMark({
	submission,
}: {
	submission: HostParticipantStanding['submission']
}): JSX.Element | null {
	if (!submission) return null

	const awardedScoreDisplay = `${submission.isCorrect || !submission.submittedAt ? '+' : '-'}${Math.abs(submission.scoreAwarded)}`

	return (
		<div className='flex w-full items-center justify-between'>
			<motion.span
				initial={{ x: -10, opacity: 0 }}
				animate={{ x: 0, opacity: 1 }}
				transition={{ duration: 0.1 }}
				className={`text-sm font-bold ${submission.submittedAt ? (submission.isCorrect ? 'text-emerald-700' : 'text-rose-600') : 'text-gray-500'}`}
			>
				{awardedScoreDisplay}
			</motion.span>
			{submission.submittedAt ? (
				<motion.span
					initial={{ scale: 0.4, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.32, ease: EASE }}
					className={`grid h-7 w-7 place-items-center rounded-full ${
						submission.isCorrect
							? 'bg-emerald-100 text-emerald-700'
							: 'bg-rose-100 text-rose-600'
					}`}
				>
					{submission.isCorrect ? (
						<Check aria-label='Правильно' size={15} strokeWidth={3} />
					) : (
						<X aria-label='Неправильно' size={15} strokeWidth={3} />
					)}
				</motion.span>
			) : null}
		</div>
	)
}

function ParticipantRow({
	standing,
	showSubmission,
	startedAt,
}: {
	standing: HostParticipantStanding
	showSubmission: boolean
	startedAt: number
}): JSX.Element {
	return (
		<motion.div
			layout
			transition={{
				layout: ROW_LAYOUT_TRANSITION,
			}}
			className={`grid grid-cols-[1rem_1fr_1.5rem_4rem_4.5rem] items-center gap-2 rounded-lg border-slate-200 px-4 py-3 hover:bg-gray-100 transition-colors ${
				standing.connected ? 'bg-gray-50' : 'bg-gray-200/80'
			}`}
		>
			<div className='text-xl font-bold text-gray-600'>{standing.rank}</div>

			<div className='flex items-center gap-2'>
				<PlayerBadge name={standing.name} connected={standing.connected} />
				<p
					className={`truncate text-base font-semibold ${standing.connected ? 'text-gray-800' : 'text-gray-400'}`}
				>
					{standing.name}
				</p>
			</div>

			<div className='text-gray-800 font-semibold text-center'>
				{standing.correctCount}
			</div>

			<AnimatedScore
				score={standing.score}
				className='text-right text-xl font-bold text-indigo-600'
			/>

			<div className='flex items-center justify-end gap-2'>
				{!showSubmission ? (
					<AnswerProgress
						startedAt={startedAt}
						submittedAt={standing.submittedAt}
					/>
				) : (
					<SubmissionMark submission={standing.submission} />
				)}
			</div>
		</motion.div>
	)
}

export function ActiveGameHostScreen({
	game,
	actionErrorMessage,
	isReconnecting,
	members,
	advancePending,
	revealPending,
	onAdvanceRound,
	onRevealRound,
}: ActiveGameHostScreenProps): JSX.Element {
	const currentRound = getCurrentRound(game)
	if (game.phase === 'completed' || !currentRound) {
		return (
			<main className='grid h-full place-items-center bg-slate-950 px-5 py-8 text-white'>
				<p className='text-sm font-semibold text-slate-300'>
					Завершаем игру...
				</p>
			</main>
		)
	}

	const isLastRound = game.currentQuestionNumber === game.questionCount
	const standings = getHostStandings(game, members)
	const showSubmission = game.phase !== 'open'
	const targetCountry = getTargetCountryInfo(game)
	const targetName = targetCountry?.nameRu || targetCountry?.name || 'Страна'

	return (
		<div className='fixed inset-0 overflow-hidden min-h-150 bg-white'>
			<AnimatePresence mode='wait'>
				{isReconnecting ? (
					<FloatingNotice>Переподключаемся к комнате...</FloatingNotice>
				) : null}
			</AnimatePresence>

			<AnimatePresence mode='wait'>
				{actionErrorMessage ? (
					<FloatingNotice
						tone='error'
						offsetTop={isReconnecting ? 'stacked' : 'default'}
					>
						{actionErrorMessage}
					</FloatingNotice>
				) : null}
			</AnimatePresence>

			<div className='fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl rounded-b-[26px] border border-white/70 bg-white/94 p-5 text-center shadow-[0_0_20px_rgba(15,23,42,0.2)]'>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-amber-700'>
					Вопрос {game.currentQuestionNumber} из {game.questionCount}
				</p>
				<h1 className='mt-1 text-2xl font-black tracking-tight text-balance text-slate-950 sm:text-3xl'>
					{game.phase === 'open' ? 'Найдите: ' : 'Ответ: '}
					{targetName}
				</h1>

				{game.phase === 'open' ? (
					<div className='mt-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-500'>
						<Users aria-hidden='true' size={16} />
						{game.answeredCount} / {game.participantCount} ответили
					</div>
				) : null}
			</div>

			<div className='h-full flex flex-col items-center justify-between gap-10'>
				<div className='w-full max-w-3xl min-h-20 mt-50 px-5 overflow-x-scroll'>
					<div className='flex flex-col space-y-2.5 min-w-sm'>
						<div className='grid grid-cols-[1rem_1fr_5rem_4rem_4rem] items-center gap-2 rounded-md px-4 py-3 mb-3 text-[12px] uppercase font-extrabold text-white bg-slate-600'>
							<div className='text-xl font-bold'>
								<HashIcon className='size-4 stroke-4' />
							</div>

							<div className='ml-11 text-start text-lg'>Игрок</div>

							<div className='text-end'>Правильных ответов</div>

							<div className='text-end'>Счет</div>

							<div className='text-center'>
								{!showSubmission ? 'Ответил' : 'Ответ'}
							</div>
						</div>

						<AnimatePresence>
							{standings.map(standing => (
								<ParticipantRow
									key={standing.participantId}
									standing={standing}
									startedAt={game.startedAt}
									showSubmission={showSubmission}
								/>
							))}
						</AnimatePresence>
					</div>
				</div>

				<div className='mb-10'>
					{game.phase === 'open' ? (
						<Button
							className='flex items-center justify-center'
							variant='amber'
							is3d
							disabled={revealPending}
							onClick={() => onRevealRound()}
						>
							{revealPending ? (
								<LoaderIcon className='animate-spin' />
							) : (
								<>Раскрыть ответ</>
							)}
						</Button>
					) : (
						<Button
							className='flex items-center justify-center'
							variant={isLastRound ? 'indigo' : 'teal'}
							is3d
							disabled={advancePending}
							onClick={() => onAdvanceRound()}
						>
							{advancePending ? (
								<LoaderIcon className='animate-spin' />
							) : isLastRound ? (
								'Заверщить игру'
							) : (
								'Следующий раунд'
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
