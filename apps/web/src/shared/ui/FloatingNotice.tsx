import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '../utils'

export function FloatingNotice({
	tone = 'neutral',
	className,
	offsetTop = '5.25rem',
	children,
}: {
	tone?: 'neutral' | 'error'
	className?: string
	offsetTop?: string
	children: ReactNode
}): JSX.Element {
	return (
		<motion.div
			initial={{
				opacity: 0,
				y: -20,
				scale: 0.95,
			}}
			animate={{
				opacity: 1,
				y: 0,
				scale: 1,
			}}
			exit={{
				opacity: 0,
				y: -20,
				scale: 0.95,
			}}
			transition={{
				type: 'spring',
				stiffness: 400,
				damping: 30,
			}}
			className={cn(
				'absolute inset-x-0 z-40 flex justify-center px-4',
				`top-[${offsetTop}]`,
			)}
		>
			<p
				className={cn(
					'rounded-full px-4 py-2 text-sm font-bold shadow-lg backdrop-blur opacity-95',
					{
						'bg-rose-500/92 text-white': tone === 'error',
						'bg-slate-950/80 text-slate-100': tone === 'neutral',
					},
					className,
				)}
			>
				{children}
			</p>
		</motion.div>
	)
}
