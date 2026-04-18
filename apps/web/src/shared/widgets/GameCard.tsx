import { Link } from 'react-router-dom'
import { getButtonClassName, type ButtonVariant } from '../ui'
import { cn } from '../utils'

interface GameCardProps {
	eyebrow: string
	title: string
	description: string
	to: string
	ctaLabel: string
	tone: 'teal' | 'amber'
}

const CARD_TONE_STYLES = {
	teal: {
		surface:
			'from-teal-600/16 via-white to-white shadow-[0_24px_50px_rgba(13,148,136,0.14)]',
		accent: 'bg-teal-600 text-teal-950',
		buttonVariant: 'teal',
	},
	amber: {
		surface:
			'from-amber-400/18 via-white to-white shadow-[0_24px_50px_rgba(217,119,6,0.14)]',
		accent: 'bg-amber-400 text-amber-950',
		buttonVariant: 'amber',
	},
} satisfies Record<
	GameCardProps['tone'],
	{
		surface: string
		accent: string
		buttonVariant: ButtonVariant
	}
>

export function GameCard({
	eyebrow,
	title,
	description,
	to,
	ctaLabel,
	tone,
}: GameCardProps): JSX.Element {
	const styles = CARD_TONE_STYLES[tone]

	return (
		<Link
			to={to}
			className={cn(
				'group flex h-full flex-col rounded-[28px] border border-slate-200 bg-linear-to-br p-6 transition duration-200 hover:-translate-y-1 hover:border-slate-300',
				styles.surface,
			)}
		>
			<div className='mb-5 flex items-center justify-between gap-3'>
				<span
					className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${styles.accent}`}
				>
					{eyebrow}
				</span>
				<span className='text-xs font-semibold text-slate-500 transition group-hover:text-slate-700'>
					Открыть режим
				</span>
			</div>

			<div className='mb-6 space-y-3'>
				<h2 className='text-3xl font-black tracking-tight text-slate-950'>
					{title}
				</h2>
				<p className='text-sm leading-6 text-slate-600'>{description}</p>
			</div>

			<div className='flex-1' />

			<div
				className={getButtonClassName({
					variant: styles.buttonVariant,
					size: 'md',
				})}
			>
				{ctaLabel}
			</div>
		</Link>
	)
}
