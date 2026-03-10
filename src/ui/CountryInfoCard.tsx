import type { CountryInfo } from '../data/types'

interface CountryInfoCardProps {
	info: CountryInfo
}

export function CountryInfoCard({ info }: CountryInfoCardProps): JSX.Element {
	return (
		<article className='w-55 overflow-hidden rounded-xl bg-white'>
			{info.flagUrl ? (
				<img
					src={info.flagUrl}
					alt={`Flag: ${info.nameRu}`}
					className='h-22 w-full object-cover'
				/>
			) : (
				<div className='h-22 w-full bg-slate-200' />
			)}
			<div className='px-3 py-3'>
				<strong className='mb-1.5 block text-sm text-slate-900'>
					{info.nameRu}
				</strong>

				<div className='mt-1 flex items-start justify-between gap-2.5 text-xs'>
					<span className='text-slate-500'>Capital</span>
					<strong className='text-right text-slate-800'>
						{info.capitalRu}
					</strong>
				</div>
				<div className='mt-1 flex items-start justify-between gap-2.5 text-xs'>
					<span className='text-slate-500'>Currency</span>
					<strong className='text-right text-slate-800'>
						{info.currencyRu}
					</strong>
				</div>
			</div>
		</article>
	)
}
