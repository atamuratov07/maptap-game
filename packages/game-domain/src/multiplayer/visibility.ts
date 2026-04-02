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
	GameLeaderboardEntry,
	GameRoomState,
	PlayerId,
	PlayerRole,
} from './types'

export interface VisiblePlayerSummary {
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

interface VisibleRoundStateBase {
	questionNumber: number
	questionCount: number
	startedAt: number
	deadlineAt: number
	answeredCount: number
	connectedPlayerCount: number
}

export interface OpenPlayerRoundView extends VisibleRoundStateBase {
	phase: 'open'
	selfSubmission: ViewerSubmissionState | null
}

export interface RevealedPlayerRoundView extends VisibleRoundStateBase {
	phase: 'revealed'
	revealedAt: number
	correctCountryId: string
	selfSubmission: EvaluatedViewerSubmissionState | null
}

export interface LeaderboardPlayerRoundView extends VisibleRoundStateBase {
	phase: 'leaderboard'
	revealedAt: number
	leaderboardShownAt: number
	correctCountryId: string
	selfSubmission: EvaluatedViewerSubmissionState | null
}

export type PlayerRoundView =
	| OpenPlayerRoundView
	| RevealedPlayerRoundView
	| LeaderboardPlayerRoundView

export interface HostSubmissionView {
	playerId: PlayerId
	countryId: string | null
	submittedAt: number
	isCorrect: boolean
	scoreAwarded: number
}

export interface OpenHostRoundView extends VisibleRoundStateBase {
	phase: 'open'
	selfSubmission: ViewerSubmissionState | null
}

export interface RevealedHostRoundView extends VisibleRoundStateBase {
	phase: 'revealed'
	revealedAt: number
	correctCountryId: string
	selfSubmission: EvaluatedViewerSubmissionState | null
	submissions: HostSubmissionView[]
}

export interface LeaderboardHostRoundView
	extends VisibleRoundStateBase {
	phase: 'leaderboard'
	revealedAt: number
	leaderboardShownAt: number
	correctCountryId: string
	selfSubmission: EvaluatedViewerSubmissionState | null
	submissions: HostSubmissionView[]
}

export type HostRoundView =
	| OpenHostRoundView
	| RevealedHostRoundView
	| LeaderboardHostRoundView

interface GameRoomViewBase {
	roomId: string
	roomCode: string
	phase: GameRoomState['phase']
	hostPlayerId: PlayerId
	viewerPlayerId: PlayerId
	questionCount: number
	currentQuestionNumber: number
	players: VisiblePlayerSummary[]
	leaderboard: GameLeaderboardEntry[] | null
}

export interface PlayerRoomView extends GameRoomViewBase {
	role: 'player'
	currentRound: PlayerRoundView | null
}

export interface HostRoomView extends GameRoomViewBase {
	role: 'host'
	currentRound: HostRoundView | null
}

function toVisiblePlayers(
	state: GameRoomState,
	options: {
		hideCompetitiveStats?: boolean
	} = {},
): VisiblePlayerSummary[] {
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

function getSharedRoundState(state: GameRoomState) {
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
	state: GameRoomState,
): GameLeaderboardEntry[] | null {
	return state.phase === 'leaderboard' || state.phase === 'finished'
		? getLeaderboard(state)
		: null
}

export function toPlayerRoomView(
	state: GameRoomState,
	viewerPlayerId: PlayerId,
): PlayerRoomView | undefined {
	const viewer = getPlayer(state, viewerPlayerId)
	if (!viewer || viewer.role === 'host') {
		return undefined
	}

	const sharedRoundState = getSharedRoundState(state)
	const viewerSubmission = getPlayerSubmission(state, viewerPlayerId)

	let currentRound: PlayerRoundView | null = null

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
				selfSubmission:
					viewerSubmission
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
				selfSubmission:
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
				selfSubmission:
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
		role: 'player',
		questionCount: getQuestionCount(state),
		currentQuestionNumber: getCurrentQuestionNumber(state),
		players: toVisiblePlayers(state, {
			hideCompetitiveStats:
				state.phase !== 'leaderboard' && state.phase !== 'finished',
		}),
		leaderboard: getVisibleLeaderboard(state),
		currentRound,
	}
}

export function toHostRoomView(
	state: GameRoomState,
	viewerPlayerId: PlayerId,
): HostRoomView | undefined {
	const viewer = getPlayer(state, viewerPlayerId)
	if (!viewer || viewer.role !== 'host') {
		return undefined
	}

	const sharedRoundState = getSharedRoundState(state)
	const viewerSubmission = getPlayerSubmission(state, viewerPlayerId)

	let currentRound: HostRoundView | null = null

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
				selfSubmission:
					viewerSubmission
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
					selfSubmission:
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
					selfSubmission:
						viewerSubmission && 'isCorrect' in viewerSubmission
							? toEvaluatedSubmissionView(viewerSubmission)
							: null,
					submissions,
				}
			}
		}
	}

	return {
		roomId: state.roomId,
		roomCode: state.roomCode,
		phase: state.phase,
		hostPlayerId: state.hostPlayerId,
		viewerPlayerId,
		role: 'host',
		questionCount: getQuestionCount(state),
		currentQuestionNumber: getCurrentQuestionNumber(state),
		players: toVisiblePlayers(state),
		leaderboard: getVisibleLeaderboard(state),
		currentRound,
	}
}

export function toRoomView(
	state: GameRoomState,
	viewerPlayerId: PlayerId,
): HostRoomView | PlayerRoomView | undefined {
	const viewer = getPlayer(state, viewerPlayerId)
	if (!viewer) {
		return undefined
	}

	return viewer.role === 'host'
		? toHostRoomView(state, viewerPlayerId)
		: toPlayerRoomView(state, viewerPlayerId)
}
