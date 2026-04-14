export function SelectedAnswerMarker(): JSX.Element {
	return (
		<div
			aria-hidden='true'
			className='pointer-events-none select-none drop-shadow-[0_10px_18px_rgba(15,23,42,0.42)]'
			style={{ color: '#f8fafc' }}
		>
			<svg
				xmlns='http://www.w3.org/2000/svg'
				width='24'
				height='24'
				viewBox='0 0 24 24'
				fill='none'
				stroke='currentColor'
				strokeWidth='2'
				strokeLinecap='round'
				strokeLinejoin='round'
				className='h-9 w-9'
			>
				<path d='M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0' />
				<circle cx='12' cy='10' r='3' />
			</svg>
		</div>
	)
}
