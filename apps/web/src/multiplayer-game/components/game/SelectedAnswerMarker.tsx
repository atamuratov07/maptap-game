import { MapPin } from 'lucide-react'

export function SelectedAnswerMarker(): JSX.Element {
	return (
		<div
			aria-hidden='true'
			className='pointer-events-none select-none drop-shadow-[0_10px_18px_rgba(15,23,42,0.42)]'
			style={{ color: '#f8fafc' }}
		>
			<MapPin aria-hidden='true' strokeWidth={2} className='h-9 w-9' />
		</div>
	)
}
