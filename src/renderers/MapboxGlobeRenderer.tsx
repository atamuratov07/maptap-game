import { geoCentroid } from 'd3-geo'
import type { FeatureCollection, Geometry } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CountryFeature } from '../data/types'
import type { MapRendererProps } from './types'

type MapboxMap = import('mapbox-gl').Map
type GeoJSONSource = import('mapbox-gl').GeoJSONSource

interface MapboxGlobeRendererProps extends MapRendererProps {
	token: string
	onCriticalError?: () => void
}

const SOURCE_ID = 'maptap-countries'
const FILL_LAYER_ID = 'maptap-countries-fill'
const OUTLINE_LAYER_ID = 'maptap-countries-outline'
const DEFAULT_MAP_CENTER: [number, number] = [8, 18]
const DEFAULT_MAP_ZOOM = 1.1
const REVEALED_MAP_ZOOM = 3.4

const NEUTRAL_FILL = '#d1d5db'
const WRONG_FILL = '#f87171'
const REVEALED_FILL = '#22c55e'

function buildFillExpression(
	revealedId: string | undefined,
	wrongIds: string[],
): unknown[] {
	const expression: unknown[] = ['match', ['to-string', ['id']]]

	const uniqueWrong = [...new Set(wrongIds)]
	for (const wrongId of uniqueWrong) {
		expression.push(wrongId, WRONG_FILL)
	}

	if (revealedId) {
		expression.push(revealedId, REVEALED_FILL)
	}

	expression.push(NEUTRAL_FILL)
	return expression
}

function addOrUpdateSource(
	map: MapboxMap,
	collection: FeatureCollection<Geometry, Record<string, unknown>>,
): void {
	const existing = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
	if (existing) {
		existing.setData(collection as never)
		return
	}

	map.addSource(SOURCE_ID, {
		type: 'geojson',
		data: collection as never,
	})
}

function ensureLayers(map: MapboxMap): void {
	if (!map.getLayer(FILL_LAYER_ID)) {
		map.addLayer({
			id: FILL_LAYER_ID,
			type: 'fill',
			source: SOURCE_ID,
			paint: {
				'fill-color': NEUTRAL_FILL,
				'fill-opacity': 0.82,
			},
		})
	}

	if (!map.getLayer(OUTLINE_LAYER_ID)) {
		map.addLayer({
			id: OUTLINE_LAYER_ID,
			type: 'line',
			source: SOURCE_ID,
			paint: {
				'line-color': '#475569',
				'line-width': 0.55,
			},
		})
	}
}

export function MapboxGlobeRenderer({
	token,
	features,
	onPick,
	highlighted,
	wrongChoiceLabels,
	pinned,
	disabled = false,
	onCriticalError,
}: MapboxGlobeRendererProps): JSX.Element {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const mapRef = useRef<MapboxMap | null>(null)
	const onPickRef = useRef(onPick)
	const disabledRef = useRef(disabled)
	const wrongIdsRef = useRef<Set<string>>(new Set(highlighted.wrongIds))
	const hasNotifiedFailureRef = useRef(false)

	const [isReady, setIsReady] = useState(false)
	const [overlayPosition, setOverlayPosition] = useState<{
		x: number
		y: number
	} | null>(null)
	const [wrongOverlayPositions, setWrongOverlayPositions] = useState<
		Array<{ countryId: string; label: string; x: number; y: number }>
	>([])
	const [hasFailure, setHasFailure] = useState(false)

	useEffect(() => {
		onPickRef.current = onPick
	}, [onPick])

	useEffect(() => {
		disabledRef.current = disabled
	}, [disabled])

	useEffect(() => {
		wrongIdsRef.current = new Set(highlighted.wrongIds)
	}, [highlighted.wrongIds])

	const featureCollection = useMemo<
		FeatureCollection<Geometry, Record<string, unknown>>
	>(
		() => ({
			type: 'FeatureCollection',
			features,
		}),
		[features],
	)

	const pinnedFeature = useMemo<CountryFeature | null>(() => {
		if (!pinned) {
			return null
		}

		return features.find(item => item.id === pinned.countryId) ?? null
	}, [features, pinned])

	const revealedFeature = useMemo<CountryFeature | null>(() => {
		if (!highlighted.revealedId) {
			return null
		}

		return features.find(item => item.id === highlighted.revealedId) ?? null
	}, [features, highlighted.revealedId])

	const pinnedCentroid = useMemo<[number, number] | null>(() => {
		if (!pinnedFeature) {
			return null
		}

		const [longitude, latitude] = geoCentroid(pinnedFeature as never)
		if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
			return null
		}

		return [longitude, latitude]
	}, [pinnedFeature])

	const revealedCentroid = useMemo<[number, number] | null>(() => {
		if (!revealedFeature) {
			return null
		}

		const [longitude, latitude] = geoCentroid(revealedFeature as never)
		if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
			return null
		}

		return [longitude, latitude]
	}, [revealedFeature])

	const wrongCentroids = useMemo<
		Array<{ countryId: string; label: string; coordinates: [number, number] }>
	>(() => {
		const items: Array<{
			countryId: string
			label: string
			coordinates: [number, number]
		}> = []

		for (const item of wrongChoiceLabels) {
			const countryFeature = features.find(
				featureItem => featureItem.id === item.countryId,
			)
			if (!countryFeature) {
				continue
			}

			const [longitude, latitude] = geoCentroid(countryFeature as never)
			if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
				continue
			}

			items.push({
				countryId: item.countryId,
				label: item.label,
				coordinates: [longitude, latitude],
			})
		}

		return items
	}, [features, wrongChoiceLabels])

	const notifyFailure = useCallback(() => {
		if (hasNotifiedFailureRef.current) {
			return
		}

		hasNotifiedFailureRef.current = true
		setHasFailure(true)
		onCriticalError?.()
	}, [onCriticalError])

	useEffect(() => {
		let cancelled = false

		const mountMap = async (): Promise<void> => {
			if (!containerRef.current) {
				return
			}

			try {
				const mapboxModule = await import('mapbox-gl')
				if (cancelled || !containerRef.current) {
					return
				}

				const mapboxgl = mapboxModule.default
				mapboxgl.accessToken = token

				const map = new mapboxgl.Map({
					container: containerRef.current,
					style: 'mapbox://styles/mapbox/light-v11',
					projection: 'globe',
					center: DEFAULT_MAP_CENTER,
					zoom: DEFAULT_MAP_ZOOM,
				})

				mapRef.current = map
				map.addControl(
					new mapboxgl.NavigationControl({
						showCompass: false,
						showZoom: true,
					}),
					'top-right',
				)

				map.on('style.load', () => {
					map.setFog({})
				})

				map.on('load', () => {
					if (cancelled) {
						return
					}

					addOrUpdateSource(map, featureCollection)
					ensureLayers(map)
					setIsReady(true)
				})

				map.on('click', FILL_LAYER_ID, event => {
					if (disabledRef.current) {
						return
					}

					const pickedFeature = event.features?.[0]
					const rawId = pickedFeature?.id
					if (rawId === undefined || rawId === null) {
						return
					}

					const pickedId = String(rawId)
					if (wrongIdsRef.current.has(pickedId)) {
						return
					}

					onPickRef.current(pickedId)
				})

				map.on('mousemove', FILL_LAYER_ID, event => {
					const hoveredFeature = event.features?.[0]
					const rawId = hoveredFeature?.id
					const hoveredId =
						rawId === undefined || rawId === null ? '' : String(rawId)

					const canPickCountry =
						!disabledRef.current &&
						Boolean(hoveredId) &&
						!wrongIdsRef.current.has(hoveredId)

					map.getCanvas().style.cursor = canPickCountry
						? 'pointer'
						: 'default'
				})

				map.on('mouseleave', FILL_LAYER_ID, () => {
					map.getCanvas().style.cursor = ''
				})

				map.on('error', () => {
					if (!cancelled) {
						notifyFailure()
					}
				})
			} catch {
				if (!cancelled) {
					notifyFailure()
				}
			}
		}

		setHasFailure(false)
		hasNotifiedFailureRef.current = false
		void mountMap()

		return () => {
			cancelled = true
			setIsReady(false)
			setOverlayPosition(null)
			setWrongOverlayPositions([])
			if (mapRef.current) {
				mapRef.current.remove()
				mapRef.current = null
			}
		}
	}, [featureCollection, notifyFailure, token])

	useEffect(() => {
		const map = mapRef.current
		if (!map || !isReady) {
			return
		}

		addOrUpdateSource(map, featureCollection)
		if (!map.getLayer(FILL_LAYER_ID)) {
			ensureLayers(map)
		}
	}, [featureCollection, isReady])

	useEffect(() => {
		const map = mapRef.current
		if (!map || !isReady || !map.getLayer(FILL_LAYER_ID)) {
			return
		}

		map.setPaintProperty(
			FILL_LAYER_ID,
			'fill-color',
			buildFillExpression(
				highlighted.revealedId,
				highlighted.wrongIds,
			) as never,
		)
	}, [highlighted.revealedId, highlighted.wrongIds, isReady])

	useEffect(() => {
		const map = mapRef.current
		if (!map || !isReady) {
			return
		}

		if (highlighted.revealedId && revealedCentroid) {
			map.easeTo({
				center: [revealedCentroid[0], revealedCentroid[1]],
				zoom: REVEALED_MAP_ZOOM,
				duration: 900,
				essential: true,
			})
			return
		}

		if (!highlighted.revealedId) {
			map.easeTo({
				center: DEFAULT_MAP_CENTER,
				zoom: DEFAULT_MAP_ZOOM,
				duration: 700,
				essential: true,
			})
		}
	}, [highlighted.revealedId, isReady, revealedCentroid])

	useEffect(() => {
		const map = mapRef.current
		if (!map || !isReady) {
			setOverlayPosition(null)
			setWrongOverlayPositions([])
			return
		}

		const syncOverlay = (): void => {
			if (pinned && pinnedCentroid) {
				const projected = map.project([pinnedCentroid[0], pinnedCentroid[1]])
				setOverlayPosition({
					x: projected.x,
					y: projected.y,
				})
			} else {
				setOverlayPosition(null)
			}

			setWrongOverlayPositions(
				wrongCentroids.map(item => {
					const projected = map.project([
						item.coordinates[0],
						item.coordinates[1],
					])

					return {
						countryId: item.countryId,
						label: item.label,
						x: projected.x,
						y: projected.y,
					}
				}),
			)
		}

		syncOverlay()
		map.on('move', syncOverlay)

		return () => {
			map.off('move', syncOverlay)
		}
	}, [isReady, pinned, pinnedCentroid, wrongCentroids])

	return (
		<div className='mapbox-container'>
			<div ref={containerRef} className='mapbox-canvas' />

			{wrongOverlayPositions.map(item => (
				<div
					key={`wrong-overlay-${item.countryId}`}
					className='mapbox-wrong-overlay'
					style={{
						left: `${item.x}px`,
						top: `${item.y}px`,
					}}
				>
					{item.label}
				</div>
			))}

			{pinned && overlayPosition ? (
				<div
					className='mapbox-pin-overlay'
					style={{
						left: `${overlayPosition.x}px`,
						top: `${overlayPosition.y}px`,
					}}
				>
					{pinned.element}
				</div>
			) : null}

			{hasFailure ? (
				<div className='renderer-message'>
					Глобус недоступен. Переключаемся на карту 2D.
				</div>
			) : null}
		</div>
	)
}
