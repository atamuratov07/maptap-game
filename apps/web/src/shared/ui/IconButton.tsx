import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils'

export interface IconButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement> {
	active?: boolean
}

export function IconButton({
	active = false,
	className,
	disabled,
	...props
}: IconButtonProps): JSX.Element {
	return (
		<button
			className={cn(
				'inline-flex h-12 w-12 items-center justify-center rounded-lg transition',
				active ? 'bg-blue-500 text-white' : 'bg-gray-500 text-slate-100',
				disabled
					? 'cursor-not-allowed opacity-50'
					: 'cursor-pointer hover:bg-blue-700',
				className,
			)}
			disabled={disabled}
			{...props}
		/>
	)
}
