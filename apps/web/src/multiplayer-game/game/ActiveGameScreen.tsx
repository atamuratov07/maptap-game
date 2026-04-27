import type {
	GameView,
	PlayerAnswer,
} from '@maptap/game-domain/multiplayer-next/game'
import type { VisibleMemberInfo } from '@maptap/game-domain/multiplayer-next/room'
import { CountryMapGameScreen } from './country-map/CountryMapGameScreen'
import { QuizGameScreen } from './quiz/QuizGameScreen'

interface ActiveGameScreenProps {
	game: GameView
	members: VisibleMemberInfo[]
	submitPending: boolean
	actionErrorMessage: string | null
	isReconnecting: boolean
	onSubmitAnswer: (answer: PlayerAnswer) => Promise<void>
}

export function ActiveGameScreen(props: ActiveGameScreenProps): JSX.Element {
	if (props.game.gameKind === 'quiz') {
		return <QuizGameScreen {...props} />
	}

	return <CountryMapGameScreen {...props} />
}
