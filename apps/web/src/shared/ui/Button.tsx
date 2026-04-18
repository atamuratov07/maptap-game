import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { getButtonClassName, type ButtonSize, type ButtonVariant } from './buttonStyles'

export interface ButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant
	size?: ButtonSize
}

export function Button({
	variant = 'amber',
	size = 'md',
	className,
	...props
}: ButtonProps): JSX.Element {
	return (
		<button
			className={getButtonClassName({ variant, size, className })}
			{...props}
		/>
	)
}

export interface ButtonLinkProps extends LinkProps {
	variant?: ButtonVariant
	size?: ButtonSize
}

export function ButtonLink({
	variant = 'amber',
	size = 'md',
	className,
	...props
}: ButtonLinkProps): JSX.Element {
	return (
		<Link
			className={getButtonClassName({ variant, size, className })}
			{...props}
		/>
	)
}
