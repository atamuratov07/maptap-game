import type { GameScope } from '@maptap/game-domain'
import type { ReactNode } from 'react'

export interface MapRendererProps {
	onPick: (countryId: string) => void
	interactiveIds: ReadonlySet<string>
	scope: GameScope
	wrongIds: string[]
	revealedInfo: null | {
		countryId: string
		longitude: number
		latitude: number
		element: ReactNode
	}
	disabled?: boolean
}
