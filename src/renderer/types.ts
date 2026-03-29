import type { ReactNode } from 'react'

export interface MapRendererProps {
	onPick: (countryId: string) => void
	playableIds: ReadonlySet<string>
	wrongIds: string[]
	revealedInfo: null | {
		countryId: string
		longitude: number
		latitude: number
		element: ReactNode
	}
	disabled?: boolean
}
