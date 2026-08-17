import { forwardRef } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { toLocaleSegment } from '../shared/i18n/locale-segment'
import { useCurrentLocale } from './LocaleContext'

function prefixPath(path: string, segment: string): string {
	if (!path.startsWith('/')) return path
	return `/${segment}${path}`
}

export const LocalizedLink = forwardRef<HTMLAnchorElement, LinkProps>(
	function LocalizedLink({ to, ...rest }, ref) {
		const segment = toLocaleSegment(useCurrentLocale())

		const prefixedTo =
			typeof to === 'string'
				? prefixPath(to, segment)
				: { ...to, pathname: prefixPath(to.pathname ?? '', segment) }

		return <Link ref={ref} to={prefixedTo} {...rest} />
	},
)
