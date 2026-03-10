import { useCallback, useState } from 'react'
import type { GameConfig } from '../core/types'
import { HomeScreen } from '../ui/HomeScreen'
import { Game } from './Game'

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20]

function buildGameConfig(
	questionCount: number,
	attemptsPerQuestion: number,
): GameConfig {
	return {
		questionCount,
		attemptsPerQuestion,
	}
}

export default function App(): JSX.Element {
	const [questionCount, setQuestionCount] = useState(10)
	const [activeConfig, setActiveConfig] = useState<GameConfig | null>(null)

	const handleStart = useCallback(() => {
		setActiveConfig(buildGameConfig(questionCount, 3))
	}, [questionCount])

	const handleBackToHome = useCallback(() => {
		setActiveConfig(null)
	}, [])

	if (!activeConfig) {
		return (
			<div className='min-h-screen'>
				<HomeScreen
					questionCount={questionCount}
					questionCountOptions={QUESTION_COUNT_OPTIONS}
					onQuestionCountChange={setQuestionCount}
					onStart={handleStart}
				/>
			</div>
		)
	}

	return <Game config={activeConfig} onBackToHome={handleBackToHome} />
}
