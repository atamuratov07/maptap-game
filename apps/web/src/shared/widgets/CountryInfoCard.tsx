import type { CountryInfo } from '@maptap/country-catalog'

const CONTINENT_LABELS: Record<CountryInfo['continent'], string> = {
	africa: 'Африка',
	asia: 'Азия',
	europe: 'Европа',
	'north-america': 'Северная Америка',
	oceania: 'Океания',
	'south-america': 'Южная Америка',
}

function textOrUnknown(value: string): string {
	const normalized = value.trim()
	return normalized ? normalized : 'Неизвестно'
}

function populationLabel(value: number): string {
	if (!Number.isFinite(value) || value <= 0) {
		return 'Неизвестно'
	}

	return value.toLocaleString('ru-RU')
}

const TAG_STYLES: Record<
	string,
	{
		className: string
	}
> = {
	Независимое: {
		className: 'border-emerald-200 bg-emerald-50/90 text-emerald-800',
	},
	'Член ООН': {
		className: 'border-sky-200 bg-sky-50/90 text-sky-800',
	},
}

function Tag({ label }: { label: string }): JSX.Element {
	const styles = TAG_STYLES[label]

	return (
		<span
			className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${styles?.className ?? 'border-slate-200 bg-slate-100 text-slate-700'}`}
		>
			{label}
		</span>
	)
}

function InfoRow({
	label,
	value,
}: {
	label: string
	value: string
}): JSX.Element {
	return (
		<div className='flex items-baseline justify-between gap-3'>
			<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500'>
				{label}
			</p>
			<p className='text-right text-sm font-black leading-snug text-slate-950'>
				{value}
			</p>
		</div>
	)
}

export function CountryInfoCard({ info }: { info: CountryInfo }): JSX.Element {
	const displayName = textOrUnknown(info.nameRu || info.name)
	const displayCapital = textOrUnknown(info.capitalRu || info.capital)
	const displayCurrency = textOrUnknown(info.currencyRu || info.currency)
	const displayPopulation = populationLabel(info.population)
	const continentLabel = CONTINENT_LABELS[info.continent]
	const tags = [
		info.independent ? 'Независимое' : null,
		info.unMember ? 'Член ООН' : null,
	].filter((value): value is string => value !== null)

	return (
		<article className='w-70 overflow-hidden rounded-3xl bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))] text-slate-950 shadow-[0_22px_48px_rgba(15,23,42,0.16)] backdrop-blur'>
			<div className='relative h-40 overflow-hidden bg-slate-300'>
				{info.flagUrl ? (
					<img
						src={info.flagUrl}
						alt={`Флаг страны ${displayName}`}
						className='h-full w-full object-cover'
					/>
				) : (
					<div className='h-full w-full bg-slate-200' />
				)}
				<div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.74))]' />

				<div className='absolute inset-x-0 top-0 flex justify-start p-3'>
					<span className='rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur-md'>
						{continentLabel}
					</span>
				</div>

				<div className='absolute inset-x-0 bottom-0 p-3.5'>
					<h2 className='text-xl font-black leading-tight text-white'>
						{displayName}
					</h2>
					<p className='mt-1 text-sm font-semibold text-white/88'>
						{displayCapital}
					</p>
				</div>
			</div>

			<div className='space-y-2.5 px-3.5 py-3'>
				{tags.length > 0 ? (
					<div className='flex flex-wrap gap-1.5 pb-2'>
						{tags.map(tag => (
							<Tag key={tag} label={tag} />
						))}
					</div>
				) : null}
				<InfoRow label='Население' value={displayPopulation} />
				<InfoRow label='Валюта' value={displayCurrency} />
			</div>
		</article>
	)
}
