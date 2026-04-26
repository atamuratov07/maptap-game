import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { getButtonClassName, type ButtonSize, type ButtonVariant } from './buttonStyles'

export interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant
	size?: ButtonSize
	is3d?: boolean
}

export function Button({
	variant = 'amber',
	size = 'md',
	is3d = false,
	className,
	...props
}: ButtonProps): JSX.Element {
	return (
		<button
			className={getButtonClassName({
				variant,
				size,
				is3d,
				className,
			})}
			{...props}
		/>
	)
}

export interface ButtonLinkProps extends LinkProps {
	variant?: ButtonVariant
	size?: ButtonSize
	is3d?: boolean
}

export function ButtonLink({
	variant = 'amber',
	size = 'md',
	is3d = false,
	className,
	...props
}: ButtonLinkProps): JSX.Element {
	return (
		<Link
			className={getButtonClassName({
				variant,
				size,
				is3d,
				className,
			})}
			{...props}
		/>
	)
}
