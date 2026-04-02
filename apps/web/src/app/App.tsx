import type { GameDifficulty, GameScope } from '@maptap/game-domain'
import type { GameConfig } from '@maptap/game-domain/singleplayer'
import { useCallback, useState } from 'react'
import { HomeScreen } from '../ui/HomeScreen'
import { Game } from './Game'

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20]
const ATTEMPS_PER_QUESTION_OPTIONS = [1, 2, 3, 4, 5]
const DIFFICULTY_OPTIONS: Array<{
	value: GameDifficulty
	label: string
}> = [
	{ value: 'easy', label: 'Легкий (самые известные страны мира)' },
	{ value: 'medium', label: 'Средний' },
	{ value: 'hard', label: 'Сложный' },
]

const SCOPE_OPTIONS: Array<{
	value: GameScope
	label: string
}> = [
	{ value: 'all', label: 'Весь мир' },
	{ value: 'africa', label: 'Африка' },
	{ value: 'asia', label: 'Азия' },
	{ value: 'europe', label: 'Европа' },
	{ value: 'north-america', label: 'Северная Америка' },
	{ value: 'south-america', label: 'Южная Америка' },
	{ value: 'oceania', label: 'Океания' },
]

function buildGameConfig(
	questionCount: number,
	attemptsPerQuestion: number,
	scope: GameScope,
	difficulty: GameDifficulty,
): GameConfig {
	return {
		questionCount,
		attemptsPerQuestion,
		difficulty,
		scope,
	}
}

export default function App(): JSX.Element {
	const [questionCount, setQuestionCount] = useState(10)
	const [attemptsPerQuestion, setAttemptsPerQuestion] = useState(3)
	const [scope, setScope] = useState<GameScope>('all')
	const [difficulty, setDifficulty] = useState<GameDifficulty>('easy')
	const [activeConfig, setActiveConfig] = useState<GameConfig | null>(null)

	const handleStart = useCallback(() => {
		setActiveConfig(
			buildGameConfig(questionCount, attemptsPerQuestion, scope, difficulty),
		)
	}, [questionCount, attemptsPerQuestion, scope, difficulty])

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
					scope={scope}
					scopeOptions={SCOPE_OPTIONS}
					onScopeChange={setScope}
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
