import type { GameConfig } from '../core/types'
import { GameScreen } from '../ui/GameScreen'
import { ResultModal } from '../ui/ResultModal'
import { useGameSession } from './useGameSession'

interface GameProps {
	config: GameConfig
	onBackToHome: () => void
}

export function Game({ config, onBackToHome }: GameProps): JSX.Element {
	const {
		gameData,
		isLoading,
		loadError,
		engineState,
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
						Загружаем геометрию карты и данные о странах...
					</p>
				</div>
			</div>
		)
	}

	if (loadError || !gameData) {
		return (
			<div className='grid min-h-screen place-items-center px-5'>
				<div className='w-full max-w-115 rounded-2xl border border-slate-300 bg-white p-6 text-center shadow-[0_15px_35px_rgba(15,23,42,0.12)]'>
					<h1 className='mb-2 text-2xl font-bold text-slate-900'>
						Не удалось загрузить данные игры
					</h1>
					<p className='mb-4 text-slate-700'>
						{loadError || 'Неизвестная ошибка.'}
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
				infoMap={gameData.countriesInfo}
				onPick={handlePick}
				onGiveUp={handleGiveUp}
				onNext={handleNext}
			/>

			<ResultModal
				open={engineState.phase === 'finished'}
				score={engineState.score}
				correctCount={engineState.correctCount}
				totalCount={engineState.questionIds.length}
				onTryAgain={handleTryAgain}
				onHome={onBackToHome}
			/>
		</div>
	)
}
