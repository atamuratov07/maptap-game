import { useTranslation } from 'react-i18next'
import { APP_LANGUAGE_OPTIONS, type AppLanguage } from './locales'
import { useAppLanguage } from './useAppLanguage'
import { cn } from '../utils'
import { GlobeIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toLocaleSegment } from './locale-segment'

interface LanguageSwitcherProps {
	className?: string
	tone?: 'light' | 'dark'
}

export function LanguageSwitcher({
	className,
	tone = 'light',
}: LanguageSwitcherProps): JSX.Element {
	const { t } = useTranslation()
	const language = useAppLanguage()
	const navigate = useNavigate()
	const location = useLocation()
	const isDark = tone === 'dark'

	const handleChange = (next: AppLanguage) => {
		const localeSegment = toLocaleSegment(next)
		const segements = location.pathname.split('/').filter(Boolean)
		const localizedPath = [localeSegment, ...segements].join('/')
		navigate('/' + localizedPath + location.search, {
			replace: true,
		})
	}

	return (
		<label
			className={cn(
				'inline-flex w-fit max-w-full flex-none items-center gap-1 rounded-full border px-3 py-2 text-sm font-black shadow-sm',
				isDark && 'border-white/15 bg-white/10 text-white',
				!isDark && 'border-slate-200 bg-white/85 text-slate-800',
				className,
			)}
		>
			<span className='sr-only'>{t('app.language')}</span>
			<GlobeIcon aria-hidden='true' size={16} strokeWidth={2.4} />
			<select
				aria-label={t('app.language')}
				className={cn(
					'cursor-pointer bg-transparent text-xs font-bold uppercase outline-none',
					isDark && 'text-white',
					!isDark && 'text-slate-800',
				)}
				value={language}
				onChange={event => {
					handleChange(event.target.value as AppLanguage)
				}}
			>
				{APP_LANGUAGE_OPTIONS.map(option => (
					<option key={option.value} value={option.value}>
						{option.shortLabel}
					</option>
				))}
			</select>
		</label>
	)
}
