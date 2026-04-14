import type { CountryId, GameQuestionSetConfig } from '../shared/types'

export type RoomId = string
export type RoomCode = string
export type PlayerId = string

export type PlayerRole = 'host' | 'player'

export const ROOM_PHASES = [
	'lobby',
	'question_open',
	'question_revealed',
	'leaderboard',
	'finished',
] as const
export type RoomPhase = (typeof ROOM_PHASES)[number]

export interface GameConfig extends GameQuestionSetConfig {
	questionDurationMs: number
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
	questionCount: 10,
	difficulty: 'easy',
	scope: 'all',
	questionDurationMs: 30_000,
}

export interface GameSession {
	config: GameConfig
	eligibleIds: CountryId[]
	questionIds: CountryId[]
}

export interface GamePlayerState {
	id: PlayerId
	name: string
	role: PlayerRole
	connected: boolean
	joinedAt: number
	lastConnectedAt: number
	lastDisconnectedAt: number | null
	score: number
	correctCount: number
}

interface GameSubmissionBase {
	playerId: PlayerId
	countryId: CountryId
	submittedAt: number
}

export interface LockedGameSubmission extends GameSubmissionBase {}

export interface EvaluatedGameSubmission {
	playerId: PlayerId
	countryId: CountryId | null
	submittedAt: number
	isCorrect: boolean
	score: number
}

interface GameStateBase {
	questionIndex: number
	questionId: CountryId
	startedAt: number
	deadlineAt: number
}

export interface OpenRoundGameState extends GameStateBase {
	phase: 'open'
	submissions: Record<PlayerId, LockedGameSubmission>
}

export interface RevealedRoundGameState extends GameStateBase {
	phase: 'revealed'
	revealedAt: number
	submissions: Record<PlayerId, EvaluatedGameSubmission>
}

export interface LeaderboardGRoundGameState extends GameStateBase {
	phase: 'leaderboard'
	revealedAt: number
	leaderboardShownAt: number
	submissions: Record<PlayerId, EvaluatedGameSubmission>
}

export type ActiveRoundGameState =
	| OpenRoundGameState
	| RevealedRoundGameState
	| LeaderboardGRoundGameState

export interface CompletedGameRoundState extends GameStateBase {
	revealedAt: number
	leaderboardShownAt: number | null
	submissions: Record<PlayerId, EvaluatedGameSubmission>
}

interface RoomStateBase {
	roomId: RoomId
	roomCode: RoomCode
	hostPlayerId: PlayerId
	config: GameConfig
	questionIds: CountryId[]
	playersById: Record<PlayerId, GamePlayerState>
	playerOrder: PlayerId[]
	createdAt: number
	completedRounds: CompletedGameRoundState[]
}

export interface RoomLobbyState extends RoomStateBase {
	phase: 'lobby'
}

export interface RoomQuestionOpenState extends RoomStateBase {
	phase: 'question_open'
	activeRound: OpenRoundGameState
}

export interface RoomQuestionRevealedState extends RoomStateBase {
	phase: 'question_revealed'
	activeRound: RevealedRoundGameState
}

export interface RoomLeaderboardState extends RoomStateBase {
	phase: 'leaderboard'
	activeRound: LeaderboardGRoundGameState
}

export interface RoomFinishedState extends RoomStateBase {
	phase: 'finished'
	finishedAt: number
}

export type RoomState =
	| RoomLobbyState
	| RoomQuestionOpenState
	| RoomQuestionRevealedState
	| RoomLeaderboardState
	| RoomFinishedState

export interface RoomLeaderboardEntry {
	rank: number
	playerId: PlayerId
	name: string
	role: PlayerRole
	connected: boolean
	score: number
	correctCount: number
}
