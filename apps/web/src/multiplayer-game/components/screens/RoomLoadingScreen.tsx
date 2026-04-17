interface RoomLoadingScreenProps {
	label: string
	title: string
	message: string
}

export function RoomLoadingScreen({
	label,
	title,
	message,
}: RoomLoadingScreenProps): JSX.Element {
	return (
		<main className='fixed inset-0 grid place-items-center overflow-y-auto px-5 py-8'>
			<section className='w-full max-w-lg rounded-[28px] border border-slate-300 bg-white/94 p-6 text-center shadow-[0_24px_54px_rgba(15,23,42,0.14)]'>
				<p className='text-[11px] font-black uppercase tracking-[0.22em] text-amber-700'>
					{label}
				</p>
				<h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950'>
					{title}
				</h1>
				<p className='mt-3 text-sm leading-7 text-slate-600'>{message}</p>
			</section>
		</main>
	)
}
