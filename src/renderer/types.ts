import type { ReactNode } from 'react'
import type { GameScope } from '../core/types'

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
