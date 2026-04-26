import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
				'button-3d inline-flex h-12 w-12 items-center justify-center rounded-lg',
				active
					? 'button-3d-teal bg-blue-500 text-white'
					: 'button-3d-soft bg-gray-500 text-slate-100',
				active ? 'button-3d-active' : '',
				disabled
					? active
						? 'cursor-default'
						: 'cursor-not-allowed opacity-50'
					: 'cursor-pointer',
				className,
			)}
			disabled={disabled}
			{...props}
		/>
	)
}
