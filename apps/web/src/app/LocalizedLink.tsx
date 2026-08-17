import { forwardRef } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import {
	prefixWithLocale,
	toLocaleSegment,
} from '../shared/i18n/locale-segment'
import { useCurrentLocale } from './LocaleContext'

export const LocalizedLink = forwardRef<HTMLAnchorElement, LinkProps>(
	function LocalizedLink({ to, ...rest }, ref) {
		const locale = useCurrentLocale()
		const segment = toLocaleSegment(locale)
		return <Link ref={ref} to={prefixWithLocale(to, segment)} {...rest} />
	},
)
