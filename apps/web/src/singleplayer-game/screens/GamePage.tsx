import {
	getCorrectCount,
	getQuestionCount,
	getScore,
	type GameConfig,
} from '@maptap/game-domain/singleplayer'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink, ScreenShell, SurfacePanel } from '../../shared/ui'
import { GameResultModal } from '../components/GameResultModal'
import { parseGameConfig } from '../core/config'
import { useGameSession, type GameLoadErrorCode } from '../core/useGameSession'
import { GameScreen } from './GameScreen'
import { InvalidConfigScreen } from './InvalidConfigScreen'

function getLoadErrorMessage(errorCode: GameLoadErrorCode | null): string {
	if (errorCode === 'no_playable_countries') {
		return 'В каталоге не найдено игровых стран.'
	}

	if (errorCode === 'no_eligible_countries') {
		return 'Нет стран, подходящих под выбранные область и сложность.'
	}

	if (errorCode === 'insufficient_eligible_countries') {
		return 'Выбрано слишком много вопросов.'
	}

	return 'Не удалось начать игру.'
}

export function GamePage(): JSX.Element {
	const [searchParams] = useSearchParams()
	const configResult = useMemo(
		() => parseGameConfig(searchParams),
		[searchParams],
	)

	if (!configResult.ok) {
		return <InvalidConfigScreen />
	}
	return <GameContent config={configResult.value} />
}

function GameContent({ config }: { config: GameConfig }): JSX.Element {
	const navigate = useNavigate()
	const {
		gameData,
		loadErrorCode,
		engineState,
		eligibleIds,
		handleTryAgain,
		handlePick,
		handleGiveUp,
		handleNext,
	} = useGameSession(config)

	if (loadErrorCode || !gameData) {
		return (
			<ScreenShell center>
				<SurfacePanel>
					<p className='text-[11px] font-black uppercase tracking-[0.22em] text-rose-700'>
						Одиночная игра
					</p>
					<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
						Игра недоступна
					</h1>
					<p className='mt-3 text-sm leading-7 text-slate-600'>
						{getLoadErrorMessage(loadErrorCode)}
					</p>
					<div className='mt-6 flex flex-wrap gap-3'>
						<Button
							type='button'
							variant='teal'
							onClick={handleTryAgain}
						>
							Повторить
						</Button>
						<ButtonLink
							to='/singleplayer'
							variant='secondary'
						>
							Изменить настройки
						</ButtonLink>
					</div>
				</SurfacePanel>
			</ScreenShell>
		)
	}

	return (
		<div className='fixed inset-0 overflow-hidden bg-slate-950'>
			<GameScreen
				state={engineState}
				eligibleIds={eligibleIds}
				countriesInfo={gameData.countriesById}
				onPick={handlePick}
				onGiveUp={handleGiveUp}
				onNext={handleNext}
			/>

			<GameResultModal
				open={engineState.phase === 'finished'}
				score={getScore(engineState)}
				correctCount={getCorrectCount(engineState)}
				totalCount={getQuestionCount(engineState)}
				onTryAgain={handleTryAgain}
				onHome={() => {
					navigate('/')
				}}
			/>
		</div>
	)
}
