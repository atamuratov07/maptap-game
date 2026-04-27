export {
	assertNever,
	type CommandError,
	type DomainError,
	type SessionPreparationError,
} from './errors'
export {
	advanceActiveRoomGame,
	getNextActiveRoomGameAdvanceAt,
	startRoomGame,
	submitRoomGameAnswer,
	type StartRoomGameInput,
} from './orchestration'

export {
	createRoom,
	toHostRoomView,
	toPlayerRoomView,
	toRoomView,
	type MemberId,
	type RoomHostView,
	type RoomPlayerView,
	type RoomState,
	type RoomView,
} from './room/index'

export {
	DEFAULT_COUNTRY_MAP_GAME_CONFIG,
	DEFAULT_GAME_CONFIG,
	DEFAULT_QUIZ_GAME_CONFIG,
	GAME_KINDS,
	QUIZ_QUESTION_PACK_IDS,
	prepareGameSession,
	type AnswerChoice,
	type ChoiceIdAnswer,
	type CountryIdAnswer,
	type CountryMapGameConfig,
	type GameCommand,
	type GameConfig,
	type GameKind,
	type GameQuestion,
	type GameSession,
	type MapPickCountryQuestion,
	type PlayerAnswer,
	type QuestionKind,
	type QuizChoiceQuestion,
	type QuizGameConfig,
	type QuizQuestionPackId,
} from './game/index'
