import type { CountryId, GameScope } from '../../shared/types'
import type { MemberId } from '../room/types'
import {
	getAnsweredParticipantCount,
	getGameCurrentQuestionNumber,
	getGameLeaderboard,
	getGameParticipantCount,
	getGameQuestionCount,
} from './selectors'
import type {
	EvaluatedSubmission,
	GameQuestion,
	GameLeaderboardEntry,
	GameKind,
	GamePhase,
	GameResult,
	GameState,
	LockedSubmission,
	PlayerAnswer,
	QuizQuestionPackId,
} from './types'

export interface ViewerSubmissionView {
	answer: PlayerAnswer
	countryId: CountryId | null
	submittedAt: number
}

export interface EvaluatedViewerSubmissionView {
	answer: PlayerAnswer | null
	countryId: CountryId | null
	submittedAt: number
	isCorrect: boolean
	scoreAwarded: number
}

export interface HostSubmissionView extends EvaluatedViewerSubmissionView {
	participantId: MemberId
}

interface GameViewBase {
	gameId: string
	gameKind: GameKind
	phase: GamePhase
	viewerParticipantId: MemberId
	questionCount: number
	currentQuestionNumber: number
	quizPackId: QuizQuestionPackId | null
	scope: GameScope
	eligibleCountryIds: readonly CountryId[]
	participantCount: number
	viewerScore: number
	viewerCorrectCount: number
	viewerRank: number | null
	leaderboard: GameLeaderboardEntry[] | null
}

interface ActiveGameViewBase extends GameViewBase {
	startedAt: number
	deadlineAt: number
	answeredCount: number
	question: GameQuestion
	questionCountryId: CountryId
	viewerSubmission: ViewerSubmissionView | EvaluatedViewerSubmissionView | null
}

export interface OpenGamePlayerView extends ActiveGameViewBase {
	phase: 'open'
	viewerSubmission: ViewerSubmissionView | null
}

export interface RevealedGamePlayerView extends ActiveGameViewBase {
	phase: 'revealed'
	revealedAt: number
	correctCountryId: CountryId
	viewerSubmission: EvaluatedViewerSubmissionView | null
}

export interface LeaderboardGamePlayerView extends ActiveGameViewBase {
	phase: 'leaderboard'
	revealedAt: number
	leaderboardShownAt: number
	correctCountryId: CountryId
	viewerSubmission: EvaluatedViewerSubmissionView | null
	leaderboard: GameLeaderboardEntry[]
}

export interface CompletedGameView extends GameViewBase {
	phase: 'completed'
	result: GameResult
	leaderboard: GameLeaderboardEntry[]
}

export type OpenGameHostView = OpenGamePlayerView

export interface RevealedGameHostView extends RevealedGamePlayerView {
	submissions: HostSubmissionView[]
}

export interface LeaderboardGameHostView extends LeaderboardGamePlayerView {
	submissions: HostSubmissionView[]
}

export type PlayerGameView =
	| OpenGamePlayerView
	| RevealedGamePlayerView
	| LeaderboardGamePlayerView
	| CompletedGameView

export type HostGameView =
	| OpenGameHostView
	| RevealedGameHostView
	| LeaderboardGameHostView
	| CompletedGameView

export type OpenGameView = OpenGamePlayerView | OpenGameHostView
export type RevealedGameView = RevealedGamePlayerView | RevealedGameHostView
export type LeaderboardGameView =
	| LeaderboardGamePlayerView
	| LeaderboardGameHostView
export type GameView = PlayerGameView | HostGameView

export interface GameViewOptions {
	includeAllSubmissions?: boolean
}

function toViewerSubmissionView(
	submission: LockedSubmission,
): ViewerSubmissionView {
	return {
		answer: submission.answer,
		countryId: submission.countryId,
		submittedAt: submission.submittedAt,
	}
}

function toEvaluatedViewerSubmissionView(
	submission: EvaluatedSubmission,
): EvaluatedViewerSubmissionView {
	return {
		answer: submission.answer,
		countryId: submission.countryId,
		submittedAt: submission.submittedAt,
		isCorrect: submission.isCorrect,
		scoreAwarded: submission.score,
	}
}

function toHostSubmissionView(
	submission: EvaluatedSubmission,
): HostSubmissionView {
	return {
		participantId: submission.participantId,
		answer: submission.answer,
		countryId: submission.countryId,
		submittedAt: submission.submittedAt,
		isCorrect: submission.isCorrect,
		scoreAwarded: submission.score,
	}
}

function getBaseView(state: GameState, viewerId: MemberId): GameViewBase {
	const leaderboard = getGameLeaderboard(state)
	const canShowLeaderboard =
		state.phase === 'leaderboard' || state.phase === 'completed'
	const viewerParticipant = state.participantsById[viewerId]
	const viewerLeaderboardEntry =
		leaderboard.find(entry => entry.participantId === viewerId) ?? null

	return {
		gameId: state.gameId,
		gameKind: state.session.gameKind,
		phase: state.phase,
		viewerParticipantId: viewerId,
		questionCount: getGameQuestionCount(state),
		currentQuestionNumber: getGameCurrentQuestionNumber(state),
		quizPackId:
			state.session.config.gameKind === 'quiz'
				? state.session.config.packId
				: null,
		scope:
			state.session.config.gameKind === 'quiz'
				? 'all'
				: state.session.config.scope,
		eligibleCountryIds: state.session.eligibleIds,
		participantCount: getGameParticipantCount(state),
		viewerScore:
			viewerParticipant?.score ?? viewerLeaderboardEntry?.score ?? 0,
		viewerCorrectCount:
			viewerParticipant?.correctCount ??
			viewerLeaderboardEntry?.correctCount ??
			0,
		viewerRank: canShowLeaderboard
			? (viewerLeaderboardEntry?.rank ?? null)
			: null,
		leaderboard: canShowLeaderboard ? leaderboard : null,
	}
}

function getHostSubmissions(
	submissions: Record<MemberId, EvaluatedSubmission>,
): HostSubmissionView[] {
	return Object.values(submissions).map(toHostSubmissionView)
}

type ActiveViewState = Exclude<GameState, { phase: 'completed' }>

function getCurrentQuestion(state: ActiveViewState): GameQuestion {
	return (
		state.session.questions[state.currentRound.questionIndex] ?? {
			kind: 'map_pick_country',
			id: state.currentRound.questionId,
			promptCountryId: state.currentRound.questionId,
			correctCountryId: state.currentRound.questionId,
			eligibleAnswerIds: state.session.eligibleIds,
		}
	)
}

function toVisibleGameView(
	state: GameState,
	viewerId: MemberId,
	includeAllSubmissions: false,
): PlayerGameView
function toVisibleGameView(
	state: GameState,
	viewerId: MemberId,
	includeAllSubmissions: true,
): HostGameView
function toVisibleGameView(
	state: GameState,
	viewerId: MemberId,
	includeAllSubmissions: boolean,
): GameView {
	const base = getBaseView(state, viewerId)

	switch (state.phase) {
		case 'open': {
			const viewerSubmission = state.currentRound.submissions[viewerId]

			return {
				...base,
				phase: 'open',
				startedAt: state.currentRound.startedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				question: getCurrentQuestion(state),
				questionCountryId: state.currentRound.questionId,
				viewerSubmission: viewerSubmission
					? toViewerSubmissionView(viewerSubmission)
					: null,
			}
		}

		case 'revealed': {
			const viewerSubmission = state.currentRound.submissions[viewerId]
			const playerView: RevealedGamePlayerView = {
				...base,
				phase: 'revealed',
				startedAt: state.currentRound.startedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				question: getCurrentQuestion(state),
				questionCountryId: state.currentRound.questionId,
				revealedAt: state.currentRound.revealedAt,
				correctCountryId: state.currentRound.questionId,
				viewerSubmission:
					viewerSubmission && 'isCorrect' in viewerSubmission
						? toEvaluatedViewerSubmissionView(viewerSubmission)
						: null,
			}

			return includeAllSubmissions
				? {
						...playerView,
						submissions: getHostSubmissions(
							state.currentRound.submissions,
						),
					}
				: playerView
		}

		case 'leaderboard': {
			const viewerSubmission = state.currentRound.submissions[viewerId]
			const playerView: LeaderboardGamePlayerView = {
				...base,
				phase: 'leaderboard',
				startedAt: state.currentRound.startedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
				question: getCurrentQuestion(state),
				questionCountryId: state.currentRound.questionId,
				revealedAt: state.currentRound.revealedAt,
				leaderboardShownAt: state.currentRound.leaderboardShownAt,
				correctCountryId: state.currentRound.questionId,
				viewerSubmission:
					viewerSubmission && 'isCorrect' in viewerSubmission
						? toEvaluatedViewerSubmissionView(viewerSubmission)
						: null,
				leaderboard: getGameLeaderboard(state),
			}

			return includeAllSubmissions
				? {
						...playerView,
						submissions: getHostSubmissions(
							state.currentRound.submissions,
						),
					}
				: playerView
		}

		case 'completed':
			return {
				...base,
				phase: 'completed',
				result: state.result,
				leaderboard: state.result.leaderboard,
			}
	}
}

export function toPlayerGameView(
	state: GameState,
	viewerId: MemberId,
): PlayerGameView {
	return toVisibleGameView(state, viewerId, false)
}

export function toHostGameView(
	state: GameState,
	viewerId: MemberId,
): HostGameView {
	return toVisibleGameView(state, viewerId, true)
}

export function toGameView(
	state: GameState,
	viewerId: MemberId,
	options: GameViewOptions = {},
): GameView {
	return options.includeAllSubmissions
		? toHostGameView(state, viewerId)
		: toPlayerGameView(state, viewerId)
}
