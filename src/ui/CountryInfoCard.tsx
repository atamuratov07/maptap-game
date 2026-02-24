import type { CountryInfo } from '../data/types'

interface CountryInfoCardProps {
	info: CountryInfo
}

export function CountryInfoCard({ info }: CountryInfoCardProps): JSX.Element {
	return (
		<article className='country-info-card'>
			{info.flagUrl ? (
				<img
					src={info.flagUrl}
					alt={`Флаг: ${info.name}`}
					className='country-info-flag'
				/>
			) : null}
			<strong className='country-info-name'>{info.name}</strong>

			<div className='country-info-row'>
				<span>Столица</span>
				<strong>{info.capital}</strong>
			</div>
			<div className='country-info-row'>
				<span>Валюта</span>
				<strong>{info.currency}</strong>
			</div>
		</article>
	)
}
