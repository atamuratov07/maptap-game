import type {
	FillLayerSpecification,
	SymbolLayerSpecification,
} from 'react-map-gl/maplibre'
import type { MapHighlight } from './types'

export const SOURCE_ID = 'world'
export const SOURCE_LAYER_ID = 'countries'
export const COUNTRY_LAYER = 'countries'
export const CENTROIDS_LAYER = 'centroids'
export const CAPITALS_LAYER = 'capitals'

export const BASE_STYLE_LAYER_ID = 'countries-fill'
export const HOVER_LAYER_ID = 'countries-hovered'
export const HIGHLIGHT_LAYER_ID = 'countries-highlighted'
export const DIM_LAYER_ID = 'countries-dimmed'
export const COUNTRY_LABEL_LAYER_ID = 'countries-label'
export const CAPITAL_LABEL_LAYER_ID = 'capitals-label'
export const LABELS_BOTTOM_LAYER_ID = 'capitals-dot'

export const WRONG_FILL = '#f87171'
export const REVEALED_FILL = '#22c55e'
export const SELECTED_FILL = '#f59e0b'

export type FillColorExpression = NonNullable<
	FillLayerSpecification['paint']
>['fill-color']

export type FillOpacityExpression = NonNullable<
	FillLayerSpecification['paint']
>['fill-opacity']

const zoomStops = <T,>(...stops: Array<[number, T]>): Array<[number, T]> =>
	stops

export function buildHighlightLayer(
	markers: readonly MapHighlight[],
): FillLayerSpecification {
	const cases: string[] = []
	for (const marker of markers) {
		cases.push(
			marker.countryId,
			{ correct: REVEALED_FILL, wrong: WRONG_FILL, selected: SELECTED_FILL }[
				marker.tone
			],
		)
	}

	return {
		id: HIGHLIGHT_LAYER_ID,
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		paint: {
			'fill-color':
				cases.length > 0
					? ([
							'match',
							['to-string', ['get', 'ISO_N3']],
							...cases,
							'transparent',
						] as FillColorExpression)
					: 'transparent',
			'fill-outline-color': '#ffffff',
			'fill-opacity': 0.85,
		},
	}
}

export function buildDimLayer(
	interactiveIds: ReadonlySet<string>,
	enabled: boolean,
): FillLayerSpecification {
	const fillOpacity: FillOpacityExpression = !enabled
		? 0
		: interactiveIds.size === 0
			? 0.75
			: ([
					'match',
					['to-string', ['get', 'ISO_N3']],
					[...interactiveIds],
					0,
					0.75,
				] as FillOpacityExpression)

	return {
		id: DIM_LAYER_ID,
		type: 'fill',
		source: SOURCE_ID,
		'source-layer': COUNTRY_LAYER,
		paint: {
			'fill-color': '#eeeeee',
			'fill-outline-color': '#ffffff',
			'fill-opacity': fillOpacity,
		},
	}
}

export const hoverLayer: FillLayerSpecification = {
	id: HOVER_LAYER_ID,
	type: 'fill',
	source: SOURCE_ID,
	'source-layer': COUNTRY_LAYER,
	paint: {
		'fill-outline-color': '#484896',
		'fill-color': '#6e599f',
		'fill-opacity': [
			'case',
			['boolean', ['feature-state', 'hover'], false],
			0.75,
			0,
		],
	},
}

export const countryLabelLayer: SymbolLayerSpecification = {
	id: COUNTRY_LABEL_LAYER_ID,
	type: 'symbol',
	source: SOURCE_ID,
	'source-layer': CENTROIDS_LAYER,
	filter: ['all'],
	minzoom: 2,
	maxzoom: 24,
	layout: {
		'text-field': '{NAME_RU}',
		'text-font': ['Noto Sans Bold'],
		'text-size': {
			type: 'exponential',
			stops: zoomStops([2, 10], [4, 12], [6, 16]),
		},
		visibility: 'visible',
		'text-max-width': 14,
		'text-transform': {
			type: 'interval',
			stops: zoomStops<'none' | 'uppercase' | 'lowercase'>(
				[0, 'uppercase'],
				[2, 'none'],
			),
		},
	},
	paint: {
		'text-color': 'rgba(8, 37, 77, 1)',
		'text-halo-blur': {
			type: 'exponential',
			stops: zoomStops([2, 0.2], [6, 0]),
		},
		'text-halo-color': 'rgba(255, 255, 255, 1)',
		'text-halo-width': {
			type: 'exponential',
			stops: zoomStops([2, 1], [6, 1.6]),
		},
	},
}

export const capitalLabelLayer: SymbolLayerSpecification = {
	id: CAPITAL_LABEL_LAYER_ID,
	type: 'symbol',
	source: SOURCE_ID,
	'source-layer': CAPITALS_LAYER,
	minzoom: 3,
	layout: {
		'text-field': '{CAPITAL_RU}',
		'text-font': ['Noto Sans Regular'],
		'text-size': {
			type: 'exponential',
			stops: zoomStops([2, 9], [6, 12]),
		},
		'text-offset': [0, 1],
		'text-anchor': 'top',
	},
	paint: {
		'text-color': '#0f172a',
		'text-halo-color': '#ffffff',
		'text-halo-width': 1,
	},
}
