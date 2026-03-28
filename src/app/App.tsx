import { useCallback, useState } from 'react'
import type { GameConfig, GameDifficulty } from '../core/types'
import { HomeScreen } from '../ui/HomeScreen'
import { Game } from './Game'

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20]
const ATTEMPS_PER_QUESTION_OPTIONS = [1, 2, 3, 4, 5]
const DIFFICULTY_OPTIONS: Array<{
	value: GameDifficulty
	label: string
}> = [
	{ value: 'easy', label: 'Легкий (Самые известные страны мира)' },
	{ value: 'medium', label: 'Средний' },
	{ value: 'hard', label: 'Сложный' },
]

function buildGameConfig(
	questionCount: number,
	attemptsPerQuestion: number,
	difficulty: GameDifficulty,
): GameConfig {
	return {
		questionCount,
		attemptsPerQuestion,
		difficulty,
	}
}

export default function App(): JSX.Element {
	const [questionCount, setQuestionCount] = useState(10)
	const [attemptsPerQuestion, setAttemptsPerQuestion] = useState(3)
	const [difficulty, setDifficulty] = useState<GameDifficulty>('easy')
	const [activeConfig, setActiveConfig] = useState<GameConfig | null>(null)

	const handleStart = useCallback(() => {
		setActiveConfig(
			buildGameConfig(questionCount, attemptsPerQuestion, difficulty),
		)
	}, [questionCount, attemptsPerQuestion, difficulty])

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
					attemptsPerQuestion={attemptsPerQuestion}
					attemptsPerQuestionOptions={ATTEMPS_PER_QUESTION_OPTIONS}
					onAttemptsPerQuestionChange={setAttemptsPerQuestion}
					difficulty={difficulty}
					difficultyOptions={DIFFICULTY_OPTIONS}
					onDifficultyChange={setDifficulty}
					onStart={handleStart}
				/>
			</div>
		)
	}

	return <Game config={activeConfig} onBackToHome={handleBackToHome} />
}
