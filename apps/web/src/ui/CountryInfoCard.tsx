import type { CountryInfo } from '../data/types'

interface CountryInfoCardProps {
	info: CountryInfo
}

function boolLabel(value: boolean): string {
	return value ? 'Да' : 'Нет'
}

function textOrUnknown(value: string): string {
	const normalized = value.trim()
	return normalized ? normalized : 'Неизвестно'
}

function populationLabel(value: number): string {
	if (!Number.isFinite(value) || value <= 0) {
		return 'Неизвестно'
	}

	const units = [
		{ divider: 1_000_000_000_000, suffix: 'трлн' },
		{ divider: 1_000_000_000, suffix: 'млрд' },
		{ divider: 1_000_000, suffix: 'млн' },
		{ divider: 1_000, suffix: 'тыс.' },
	]

	for (const unit of units) {
		if (value >= unit.divider) {
			const scaled = value / unit.divider
			const precision = scaled < 10 ? 3 : scaled < 100 ? 2 : 1
			const formatted = scaled.toFixed(precision).replace(/\.?0+$/, '')

			return `${formatted} ${unit.suffix}`
		}
	}

	return value.toLocaleString('ru-RU')
}

function DataRow({
	label,
	value,
}: {
	label: string
	value: string
}): JSX.Element {
	return (
		<div className='mt-1 flex items-start justify-between gap-2.5 text-xs'>
			<span className='text-slate-500'>{label}</span>
			<strong className='text-right text-slate-800'>{value}</strong>
		</div>
	)
}

export function CountryInfoCard({ info }: CountryInfoCardProps): JSX.Element {
	const displayName = textOrUnknown(info.nameRu || info.name)
	const displayCapital = textOrUnknown(info.capitalRu || info.capital)
	const displayCurrency = textOrUnknown(info.currencyRu || info.currency)
	const displayPopulation = populationLabel(info.population)

	return (
		<article className='w-60 overflow-hidden rounded-xl bg-white'>
			{info.flagUrl ? (
				<img
					src={info.flagUrl}
					alt={`Флаг: ${displayName}`}
					className='w-full object-cover'
				/>
			) : (
				<div className='h-22 w-full bg-slate-200' />
			)}
			<div className='px-3 pt-4 pb-6'>
				<strong className='mb-5 block text-sm uppercase text-slate-900'>
					{displayName}
				</strong>

				<DataRow label='Столица' value={displayCapital} />
				<DataRow label='Валюта' value={displayCurrency} />
				<DataRow label='Население' value={displayPopulation} />
				<DataRow label='Независимая' value={boolLabel(info.independent)} />
				<DataRow label='Член ООН' value={boolLabel(info.unMember)} />
			</div>
		</article>
	)
}
