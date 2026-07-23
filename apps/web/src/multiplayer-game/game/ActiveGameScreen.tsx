import type { GameView } from '@maptap/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@maptap/game-domain/multiplayer/room'
import { CountryMapGameScreen } from './country-map/CountryMapGameScreen'

interface ActiveGameScreenProps {
	game: GameView
	members: VisibleMemberInfo[]
	submitPending: boolean
	actionErrorMessage: string | null
	isReconnecting: boolean
	onSubmitAnswer: (countryId: string) => Promise<void>
}

export function ActiveGameScreen(props: ActiveGameScreenProps): JSX.Element {
	// Add a game.kind switch here when the domain exposes multiple variants.
	return <CountryMapGameScreen {...props} />
}
