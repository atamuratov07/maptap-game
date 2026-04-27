import type { CountryId, GameDifficulty, GameScope } from '../../shared/types'
import type { MemberId } from '../room/types'

export const GAME_KINDS = ['country-map', 'quiz'] as const
export type GameKind = (typeof GAME_KINDS)[number]
export type GamePhase = 'open' | 'revealed' | 'leaderboard' | 'completed'

export type QuestionKind = 'map_pick_country' | 'quiz_choice'
export const QUIZ_QUESTION_PACK_IDS = [
	'uzbekistan-geography',
	'tashkent-city',
] as const
export type QuizQuestionPackId = (typeof QUIZ_QUESTION_PACK_IDS)[number]

export interface AnswerChoice {
	id: string
	label: string
}

export interface CountryIdAnswer {
	kind: 'country_id'
	countryId: CountryId
}

export interface ChoiceIdAnswer {
	kind: 'choice_id'
	choiceId: string
}

export type PlayerAnswer = CountryIdAnswer | ChoiceIdAnswer

export interface MapPickCountryQuestion {
	kind: 'map_pick_country'
	id: CountryId
	promptCountryId: CountryId
	correctCountryId: CountryId
	eligibleAnswerIds: readonly CountryId[]
}

export interface QuizChoiceQuestion {
	kind: 'quiz_choice'
	id: string
	prompt: string
	imageUrl?: string
	imageAlt?: string
	imageCredit?: string
	imageCreditUrl?: string
	choices: readonly AnswerChoice[]
	correctChoiceId: string
	difficulty: GameDifficulty
}

export type GameQuestion = MapPickCountryQuestion | QuizChoiceQuestion

interface GameConfigBase {
	questionCount: number
	questionDurationMs: number
}

export interface CountryMapGameConfig extends GameConfigBase {
	gameKind?: 'country-map'
	difficulty: GameDifficulty
	scope: GameScope
}

export interface QuizGameConfig extends GameConfigBase {
	gameKind: 'quiz'
	packId: QuizQuestionPackId
}

export type GameConfig = CountryMapGameConfig | QuizGameConfig

export const DEFAULT_COUNTRY_MAP_GAME_CONFIG: CountryMapGameConfig = {
	gameKind: 'country-map',
	questionCount: 10,
	difficulty: 'easy',
	scope: 'all',
	questionDurationMs: 30_000,
}

export const DEFAULT_QUIZ_GAME_CONFIG: QuizGameConfig = {
	gameKind: 'quiz',
	packId: 'uzbekistan-geography',
	questionCount: 10,
	questionDurationMs: 30_000,
}

export const DEFAULT_GAME_CONFIG = DEFAULT_COUNTRY_MAP_GAME_CONFIG

export interface GameSession {
	readonly gameKind: GameKind
	readonly config: Readonly<GameConfig>
	readonly eligibleIds: readonly CountryId[]
	readonly questionIds: readonly string[]
	readonly questions: readonly GameQuestion[]
}

export type GameParticipantScore = number

export type GameParticipantState = {
	id: MemberId
	score: GameParticipantScore
	correctCount: number
	// correctStreak: number
}

interface SubmissionBase {
	participantId: MemberId
	answer: PlayerAnswer
	countryId: CountryId | null
	submittedAt: number
}

export type LockedSubmission = SubmissionBase

export interface EvaluatedSubmission {
	participantId: MemberId
	answer: PlayerAnswer | null
	countryId: CountryId | null
	submittedAt: number
	isCorrect: boolean
	score: GameParticipantScore
}

export interface GameLeaderboardEntry {
	participantId: MemberId
	rank: number
	score: GameParticipantScore
	correctCount: number
}

interface RoundStateBase {
	questionIndex: number
	questionId: string
	startedAt: number
	deadlineAt: number
}

export interface OpenRoundState extends RoundStateBase {
	submissions: Record<MemberId, LockedSubmission>
}
export interface RevealedRoundState extends RoundStateBase {
	submissions: Record<MemberId, EvaluatedSubmission>
	revealedAt: number
}
export interface LeaderboardRoundState extends RoundStateBase {
	submissions: Record<MemberId, EvaluatedSubmission>
	revealedAt: number
	leaderboardShownAt: number
}
export interface CompletedRoundState extends RoundStateBase {
	revealedAt: number
	leaderboardShownAt: number | null
	submissions: Record<MemberId, EvaluatedSubmission>
}

export interface GameResult {
	gameId: string
	gameKind: GameKind
	finishedAt: number
	rounds: CompletedRoundState[]
	leaderboard: GameLeaderboardEntry[]
}

export interface GameStateBase {
	gameId: string
	session: GameSession
	participantsById: Record<MemberId, GameParticipantState>
	completedRounds: CompletedRoundState[]
	startedAt: number
}

export interface GameOpenState extends GameStateBase {
	phase: 'open'
	currentRound: OpenRoundState
}

export interface GameRevealedState extends GameStateBase {
	phase: 'revealed'
	currentRound: RevealedRoundState
}

export interface GameLeaderboardState extends GameStateBase {
	phase: 'leaderboard'
	currentRound: LeaderboardRoundState
}

export interface GameCompletedState {
	phase: 'completed'
	gameId: string
	session: GameSession
	participantsById: Record<MemberId, GameParticipantState>
	result: GameResult
	completedAt: number
}

export type GameState =
	| GameOpenState
	| GameRevealedState
	| GameLeaderboardState
	| GameCompletedState
