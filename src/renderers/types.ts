import type { ReactNode } from 'react'
import type { CountryFeature } from '../data/types'

export interface MapRendererProps {
	features: CountryFeature[]
	onPick: (countryId: string) => void
	highlighted: {
		revealedId?: string
		wrongIds: string[]
	}
	wrongChoiceLabels: Array<{
		countryId: string
		label: string
	}>
	pinned: null | {
		countryId: string
		element: ReactNode
	}
	disabled?: boolean
}
