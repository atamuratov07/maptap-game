import type { CountryId, GameQuestionSetConfig } from '../shared/types'

export type RoomId = string
export type RoomCode = string
export type PlayerId = string

export type PlayerRole = 'host' | 'player'

export type GamePhase =
	| 'lobby'
	| 'question_open'
	| 'question_revealed'
	| 'leaderboard'
	| 'finished'

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

interface SubmissionBase {
	playerId: PlayerId
	countryId: CountryId
	submittedAt: number
}

export interface LockedGameSubmission extends SubmissionBase {}

export interface EvaluatedGameSubmission {
	playerId: PlayerId
	countryId: CountryId | null
	submittedAt: number
	isCorrect: boolean
	score: number
}

interface GameRoundIdentity {
	questionIndex: number
	questionId: CountryId
}

interface GameQuestionRoundBase extends GameRoundIdentity {
	startedAt: number
	deadlineAt: number
}

export interface OpenGameRoundState extends GameQuestionRoundBase {
	phase: 'open'
	submissions: Record<PlayerId, LockedGameSubmission>
}

export interface RevealedGameRoundState extends GameQuestionRoundBase {
	phase: 'revealed'
	revealedAt: number
	submissions: Record<PlayerId, EvaluatedGameSubmission>
}

export interface LeaderboardGameRoundState
	extends GameQuestionRoundBase {
	phase: 'leaderboard'
	revealedAt: number
	leaderboardShownAt: number
	submissions: Record<PlayerId, EvaluatedGameSubmission>
}

export type ActiveGameRoundState =
	| OpenGameRoundState
	| RevealedGameRoundState
	| LeaderboardGameRoundState

export interface ArchivedGameRoundState extends GameQuestionRoundBase {
	revealedAt: number
	leaderboardShownAt: number | null
	submissions: Record<PlayerId, EvaluatedGameSubmission>
}

interface GameRoomStateBase {
	roomId: RoomId
	roomCode: RoomCode
	hostPlayerId: PlayerId
	config: GameConfig
	questionIds: CountryId[]
	playersById: Record<PlayerId, GamePlayerState>
	playerOrder: PlayerId[]
	createdAt: number
	completedRounds: ArchivedGameRoundState[]
}

export interface LobbyGameState extends GameRoomStateBase {
	phase: 'lobby'
}

export interface QuestionOpenGameState extends GameRoomStateBase {
	phase: 'question_open'
	activeRound: OpenGameRoundState
}

export interface QuestionRevealedGameState extends GameRoomStateBase {
	phase: 'question_revealed'
	activeRound: RevealedGameRoundState
}

export interface LeaderboardGameState extends GameRoomStateBase {
	phase: 'leaderboard'
	activeRound: LeaderboardGameRoundState
}

export interface FinishedGameState extends GameRoomStateBase {
	phase: 'finished'
	finishedAt: number
}

export type GameRoomState =
	| LobbyGameState
	| QuestionOpenGameState
	| QuestionRevealedGameState
	| LeaderboardGameState
	| FinishedGameState

export interface GameLeaderboardEntry {
	rank: number
	playerId: PlayerId
	name: string
	role: PlayerRole
	connected: boolean
	score: number
	correctCount: number
}

export interface CreateGameRoomInput {
	roomId: RoomId
	roomCode: RoomCode
	hostPlayerId: PlayerId
	hostName: string
	session: GameSession
	now: number
}
