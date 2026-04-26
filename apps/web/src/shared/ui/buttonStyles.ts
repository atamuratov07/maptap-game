import { cn } from '../utils'

export type ButtonVariant =
	| 'amber'
	| 'teal'
	| 'danger'
	| 'secondary'
	| 'inverse'
	| 'soft'
	| 'nav'

export type ButtonSize = 'sm' | 'md' | 'lg' | 'pill'

const BUTTON_BASE_CLASS =
	'inline-flex cursor-pointer items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-60'

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
	amber:
		'bg-amber-500 text-white shadow-[0_14px_36px_rgba(245,158,11,0.22)] hover:bg-amber-400',
	teal:
		'bg-teal-700 text-white shadow-[0_14px_36px_rgba(13,148,136,0.18)] hover:bg-teal-600',
	danger:
		'bg-red-600 text-white shadow-[0_14px_36px_rgba(220,38,38,0.2)] hover:bg-red-500',
	secondary:
		'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:text-slate-950',
	inverse:
		'bg-white text-slate-950 shadow-sm hover:bg-slate-100',
	soft:
		'bg-slate-200 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.12)] hover:bg-slate-300',
	nav: 'border border-slate-300 bg-white/85 text-slate-700 hover:border-slate-400 hover:text-slate-950',
}

const BUTTON_3D_VARIANT_CLASSES: Record<ButtonVariant, string> = {
	amber: 'button-3d button-3d-amber',
	teal: 'button-3d button-3d-teal',
	danger: 'button-3d button-3d-danger',
	secondary: 'button-3d button-3d-secondary',
	inverse: 'button-3d button-3d-inverse',
	soft: 'button-3d button-3d-soft',
	nav: 'button-3d button-3d-nav',
}

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
	sm: 'rounded-lg px-4 py-2 text-sm font-bold',
	md: 'rounded-2xl px-4 py-3 text-sm font-black',
	lg: 'min-h-12 rounded-2xl px-7 py-3 text-sm font-black',
	pill: 'rounded-full px-4 py-2 text-sm font-semibold',
}

export function getButtonClassName({
	variant = 'amber',
	size = 'md',
	is3d = false,
	className,
}: {
	variant?: ButtonVariant
	size?: ButtonSize
	is3d?: boolean
	className?: string
}): string {
	return cn(
		BUTTON_BASE_CLASS,
		BUTTON_VARIANT_CLASSES[variant],
		is3d ? BUTTON_3D_VARIANT_CLASSES[variant] : '',
		BUTTON_SIZE_CLASSES[size],
		className,
	)
}
