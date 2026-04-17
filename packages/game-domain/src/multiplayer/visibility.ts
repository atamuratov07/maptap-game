import type { CountryId } from '../shared/types'
import {
	getActiveRound,
	getAnsweredPlayerCount,
	getConnectedPlayerCount,
	getCurrentQuestionNumber,
	getLeaderboard,
	getPlayer,
	getPlayerSubmission,
	getQuestionCount,
} from './selectors'
import type {
	EvaluatedGameSubmission,
	PlayerId,
	PlayerRole,
	RoomLeaderboardEntry,
	RoomState,
} from './types'

export interface VisiblePlayerInfo {
	playerId: PlayerId
	name: string
	role: PlayerRole
	connected: boolean
	score: number | null
	correctCount: number | null
	rank: number | null
}

export interface ViewerSubmissionState {
	countryId: string
	submittedAt: number
}

export interface EvaluatedViewerSubmissionState {
	countryId: string | null
	submittedAt: number
	isCorrect: boolean
	scoreAwarded: number
}

interface RoundViewBase {
	questionNumber: number
	questionCount: number
	startedAt: number
	deadlineAt: number
	answeredCount: number
	connectedPlayerCount: number
}

export interface OpenRoundPlayerView extends RoundViewBase {
	phase: 'open'
	questionCountryId: string
	submission: ViewerSubmissionState | null
}

export interface RevealedRoundPlayerView extends RoundViewBase {
	phase: 'revealed'
	revealedAt: number
	correctCountryId: string
	submission: EvaluatedViewerSubmissionState | null
}

export interface LeaderboardRoundPlayerView extends RoundViewBase {
	phase: 'leaderboard'
	revealedAt: number
	leaderboardShownAt: number
	correctCountryId: string
	submission: EvaluatedViewerSubmissionState | null
}

export type RoundPlayerView =
	| OpenRoundPlayerView
	| RevealedRoundPlayerView
	| LeaderboardRoundPlayerView

export interface HostSubmissionView {
	playerId: PlayerId
	countryId: string | null
	submittedAt: number
	isCorrect: boolean
	scoreAwarded: number
}

export interface OpenRoundHostView extends RoundViewBase {
	phase: 'open'
	questionCountryId: string
	submission: ViewerSubmissionState | null
}

export interface RevealedRoundHostView extends RoundViewBase {
	phase: 'revealed'
	revealedAt: number
	correctCountryId: string
	submission: EvaluatedViewerSubmissionState | null
	submissions: HostSubmissionView[]
}

export interface LeaderboardRoundHostView extends RoundViewBase {
	phase: 'leaderboard'
	revealedAt: number
	leaderboardShownAt: number
	correctCountryId: string
	submission: EvaluatedViewerSubmissionState | null
	submissions: HostSubmissionView[]
}

export type RoundHostView =
	| OpenRoundHostView
	| RevealedRoundHostView
	| LeaderboardRoundHostView

interface RoomViewBase {
	roomId: string
	roomCode: string
	phase: RoomState['phase']
	hostPlayerId: PlayerId
	viewerPlayerId: PlayerId
	scope: RoomState['gameSession']['config']['scope']
	questionCount: number
	currentQuestionNumber: number
	eligibleCountryIds: readonly CountryId[]
	players: VisiblePlayerInfo[]
	leaderboard: RoomLeaderboardEntry[] | null
}

export interface RoomPlayerView extends RoomViewBase {
	role: 'player'
	currentRound: RoundPlayerView | null
}

export interface RoomHostView extends RoomViewBase {
	role: 'host'
	currentRound: RoundHostView | null
}

export type RoomView = RoomPlayerView | RoomHostView

function toVisiblePlayers(
	state: RoomState,
	options: {
		hideCompetitiveStats?: boolean
	} = {},
): VisiblePlayerInfo[] {
	const { hideCompetitiveStats = false } = options

	return getLeaderboard(state).map(entry => ({
		playerId: entry.playerId,
		name: entry.name,
		role: entry.role,
		connected: entry.connected,
		score: hideCompetitiveStats ? null : entry.score,
		correctCount: hideCompetitiveStats ? null : entry.correctCount,
		rank: hideCompetitiveStats ? null : entry.rank,
	}))
}

function toEvaluatedSubmissionView(
	submission: EvaluatedGameSubmission,
): EvaluatedViewerSubmissionState {
	return {
		countryId: submission.countryId,
		submittedAt: submission.submittedAt,
		isCorrect: submission.isCorrect,
		scoreAwarded: submission.score,
	}
}

function toHostSubmissionView(
	submission: EvaluatedGameSubmission,
): HostSubmissionView {
	return {
		playerId: submission.playerId,
		countryId: submission.countryId,
		submittedAt: submission.submittedAt,
		isCorrect: submission.isCorrect,
		scoreAwarded: submission.score,
	}
}

function getSharedRoundState(state: RoomState) {
	const activeRound = getActiveRound(state)
	if (!activeRound) {
		return null
	}

	return {
		activeRound,
		questionNumber: getCurrentQuestionNumber(state),
		questionCount: getQuestionCount(state),
		answeredCount: getAnsweredPlayerCount(state),
		connectedPlayerCount: getConnectedPlayerCount(state),
	}
}

function getVisibleLeaderboard(
	state: RoomState,
): RoomLeaderboardEntry[] | null {
	return state.phase === 'leaderboard' || state.phase === 'finished'
		? getLeaderboard(state)
		: null
}

export function toPlayerRoomView(
	state: RoomState,
	viewerPlayerId: PlayerId,
): RoomPlayerView | undefined {
	const viewer = getPlayer(state, viewerPlayerId)
	if (!viewer || viewer.role === 'host') {
		return undefined
	}

	const sharedRoundState = getSharedRoundState(state)
	const viewerSubmission = getPlayerSubmission(state, viewerPlayerId)

	let currentRound: RoundPlayerView | null = null

	if (sharedRoundState) {
		const roundBase = {
			questionNumber: sharedRoundState.questionNumber,
			questionCount: sharedRoundState.questionCount,
			startedAt: sharedRoundState.activeRound.startedAt,
			deadlineAt: sharedRoundState.activeRound.deadlineAt,
			answeredCount: sharedRoundState.answeredCount,
			connectedPlayerCount: sharedRoundState.connectedPlayerCount,
		}

		if (sharedRoundState.activeRound.phase === 'open') {
			const viewerSubmission =
				sharedRoundState.activeRound.submissions[viewerPlayerId]

			currentRound = {
				phase: 'open',
				...roundBase,
				questionCountryId: sharedRoundState.activeRound.questionId,
				submission: viewerSubmission
					? {
							countryId: viewerSubmission.countryId,
							submittedAt: viewerSubmission.submittedAt,
						}
					: null,
			}
		} else if (sharedRoundState.activeRound.phase === 'revealed') {
			currentRound = {
				phase: 'revealed',
				...roundBase,
				revealedAt: sharedRoundState.activeRound.revealedAt,
				correctCountryId: sharedRoundState.activeRound.questionId,
				submission:
					viewerSubmission && 'isCorrect' in viewerSubmission
						? toEvaluatedSubmissionView(viewerSubmission)
						: null,
			}
		} else {
			currentRound = {
				phase: 'leaderboard',
				...roundBase,
				revealedAt: sharedRoundState.activeRound.revealedAt,
				leaderboardShownAt: sharedRoundState.activeRound.leaderboardShownAt,
				correctCountryId: sharedRoundState.activeRound.questionId,
				submission:
					viewerSubmission && 'isCorrect' in viewerSubmission
						? toEvaluatedSubmissionView(viewerSubmission)
						: null,
			}
		}
	}

	return {
		roomId: state.roomId,
		roomCode: state.roomCode,
		phase: state.phase,
		hostPlayerId: state.hostPlayerId,
		viewerPlayerId,
		scope: state.gameSession.config.scope,
		role: 'player',
		questionCount: getQuestionCount(state),
		currentQuestionNumber: getCurrentQuestionNumber(state),
		eligibleCountryIds: state.gameSession.eligibleIds,
		players: toVisiblePlayers(state, {
			hideCompetitiveStats:
				state.phase !== 'leaderboard' && state.phase !== 'finished',
		}),
		leaderboard: getVisibleLeaderboard(state),
		currentRound,
	}
}

export function toHostRoomView(
	state: RoomState,
	viewerPlayerId: PlayerId,
): RoomHostView | undefined {
	const viewer = getPlayer(state, viewerPlayerId)
	if (!viewer || viewer.role !== 'host') {
		return undefined
	}

	const sharedRoundState = getSharedRoundState(state)
	const viewerSubmission = getPlayerSubmission(state, viewerPlayerId)

	let currentRound: RoundHostView | null = null

	if (sharedRoundState) {
		const roundBase = {
			questionNumber: sharedRoundState.questionNumber,
			questionCount: sharedRoundState.questionCount,
			startedAt: sharedRoundState.activeRound.startedAt,
			deadlineAt: sharedRoundState.activeRound.deadlineAt,
			answeredCount: sharedRoundState.answeredCount,
			connectedPlayerCount: sharedRoundState.connectedPlayerCount,
		}

		if (sharedRoundState.activeRound.phase === 'open') {
			const viewerSubmission =
				sharedRoundState.activeRound.submissions[viewerPlayerId]

			currentRound = {
				phase: 'open',
				...roundBase,
				questionCountryId: sharedRoundState.activeRound.questionId,
				submission: viewerSubmission
					? {
							countryId: viewerSubmission.countryId,
							submittedAt: viewerSubmission.submittedAt,
						}
					: null,
			}
		} else {
			const submissions = Object.values(
				sharedRoundState.activeRound.submissions,
			).map(toHostSubmissionView)

			if (sharedRoundState.activeRound.phase === 'revealed') {
				currentRound = {
					phase: 'revealed',
					...roundBase,
					revealedAt: sharedRoundState.activeRound.revealedAt,
					correctCountryId: sharedRoundState.activeRound.questionId,
					submission:
						viewerSubmission && 'isCorrect' in viewerSubmission
							? toEvaluatedSubmissionView(viewerSubmission)
							: null,
					submissions,
				}
			} else {
				currentRound = {
					phase: 'leaderboard',
					...roundBase,
					revealedAt: sharedRoundState.activeRound.revealedAt,
					leaderboardShownAt:
						sharedRoundState.activeRound.leaderboardShownAt,
					correctCountryId: sharedRoundState.activeRound.questionId,
					submission:
						viewerSubmission && 'isCorrect' in viewerSubmission
							? toEvaluatedSubmissionView(viewerSubmission)
							: null,
					submissions,
				}
			}
		}
	}

	return {
		role: 'host',
		roomId: state.roomId,
		roomCode: state.roomCode,
		phase: state.phase,
		hostPlayerId: state.hostPlayerId,
		viewerPlayerId,
		scope: state.gameSession.config.scope,
		questionCount: getQuestionCount(state),
		currentQuestionNumber: getCurrentQuestionNumber(state),
		eligibleCountryIds: state.gameSession.eligibleIds,
		players: toVisiblePlayers(state),
		leaderboard: getVisibleLeaderboard(state),
		currentRound,
	}
}
