import {
	getCorrectCount,
	getQuestionCount,
	getScore,
	type GameConfig,
} from '@maptap/game-domain/singleplayer'
import { GameScreen } from '../ui/GameScreen'
import { ResultModal } from '../ui/ResultModal'
import { useGameSession, type GameLoadErrorCode } from './useGameSession'

interface GameProps {
	config: GameConfig
	onBackToHome: () => void
}

function getLoadErrorMessage(errorCode: GameLoadErrorCode | null): string {
	if (errorCode === 'no_playable_countries') {
		return 'Не найдено ни одной игровой страны.'
	}

	if (
		errorCode === 'no_eligible_countries' ||
		errorCode === 'insufficient_eligible_countries' ||
		errorCode === 'invalid_question_count' ||
		errorCode === 'invalid_attempts_per_question' ||
		errorCode === 'invalid_question_duration'
	) {
		return 'Для текущих настроек не найдено подходящих стран.'
	}

	if (errorCode === 'load_failed') {
		return 'Не удалось загрузить данные игры.'
	}

	return 'Неизвестная ошибка.'
}

export function Game({ config, onBackToHome }: GameProps): JSX.Element {
	const {
		gameData,
		isLoading,
		loadErrorCode,
		engineState,
		eligibleIds,
		reloadGameData,
		handleTryAgain,
		handlePick,
		handleGiveUp,
		handleNext,
	} = useGameSession(config)

	if (isLoading) {
		return (
			<div className='grid min-h-screen place-items-center px-5'>
				<div className='w-full max-w-115 rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-[0_15px_35px_rgba(15,23,42,0.12)]'>
					<h1 className='mb-2 text-2xl font-bold text-slate-900'>
						Загрузка MapTap
					</h1>
					<p className='text-slate-700'>
						Подготавливаем страны и игровые данные...
					</p>
				</div>
			</div>
		)
	}

	if (loadErrorCode || !gameData) {
		return (
			<div className='grid min-h-screen place-items-center px-5'>
				<div className='w-full max-w-115 rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-[0_15px_35px_rgba(15,23,42,0.12)]'>
					<h1 className='mb-2 text-2xl font-bold text-slate-900'>
						Не удалось загрузить данные игры
					</h1>
					<p className='mb-4 text-slate-700'>
						{getLoadErrorMessage(loadErrorCode)}
					</p>
					<button
						type='button'
						className='rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow transition hover:-translate-y-0.5 hover:bg-teal-600'
						onClick={() => void reloadGameData()}
					>
						Повторить
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen'>
			<GameScreen
				state={engineState}
				eligibleIds={eligibleIds}
				countriesInfo={gameData.countriesInfo}
				onPick={handlePick}
				onGiveUp={handleGiveUp}
				onNext={handleNext}
			/>

			<ResultModal
				open={engineState.phase === 'finished'}
				score={getScore(engineState)}
				correctCount={getCorrectCount(engineState)}
				totalCount={getQuestionCount(engineState)}
				onTryAgain={handleTryAgain}
				onHome={onBackToHome}
			/>
		</div>
	)
}
