import type { CountryId } from '../../shared/types'
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
	GameLeaderboardEntry,
	GamePhase,
	GameResult,
	GameState,
	LockedSubmission,
} from './types'

export interface ViewerSubmissionView {
	countryId: CountryId
	submittedAt: number
}

export interface EvaluatedViewerSubmissionView {
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
	phase: GamePhase
	questionCount: number
	currentQuestionNumber: number
	eligibleCountryIds: readonly CountryId[]
	participantCount: number
	leaderboard: GameLeaderboardEntry[] | null
}

interface ActiveGameViewBase extends GameViewBase {
	startedAt: number
	deadlineAt: number
	answeredCount: number
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
export type RevealedGameView =
	| RevealedGamePlayerView
	| RevealedGameHostView
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
		countryId: submission.countryId,
		submittedAt: submission.submittedAt,
	}
}

function toEvaluatedViewerSubmissionView(
	submission: EvaluatedSubmission,
): EvaluatedViewerSubmissionView {
	return {
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
		countryId: submission.countryId,
		submittedAt: submission.submittedAt,
		isCorrect: submission.isCorrect,
		scoreAwarded: submission.score,
	}
}

function getBaseView(state: GameState): GameViewBase {
	return {
		gameId: state.gameId,
		phase: state.phase,
		questionCount: getGameQuestionCount(state),
		currentQuestionNumber: getGameCurrentQuestionNumber(state),
		eligibleCountryIds: state.session.eligibleIds,
		participantCount: getGameParticipantCount(state),
		leaderboard:
			state.phase === 'leaderboard' || state.phase === 'completed'
				? getGameLeaderboard(state)
				: null,
	}
}

function getHostSubmissions(
	submissions: Record<MemberId, EvaluatedSubmission>,
): HostSubmissionView[] {
	return Object.values(submissions).map(toHostSubmissionView)
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
	const base = getBaseView(state)

	switch (state.phase) {
		case 'open': {
			const viewerSubmission = state.currentRound.submissions[viewerId]

			return {
				...base,
				phase: 'open',
				startedAt: state.currentRound.startedAt,
				deadlineAt: state.currentRound.deadlineAt,
				answeredCount: getAnsweredParticipantCount(state),
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
