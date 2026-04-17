import { normalizeCountryId } from '@maptap/country-catalog'
import type { GameContinent, GameScope } from '@maptap/game-domain'
import type { FilterSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
	Layer,
	Marker,
	NavigationControl,
	Popup,
	type ErrorEvent,
	type MapLayerMouseEvent,
	type MapRef,
	type ProjectionSpecification,
} from 'react-map-gl/maplibre'
import { CONTINENT_VIEW_PRESETS } from './continent-view'
import {
	BASE_STYLE_LAYER_ID,
	buildDimLayer,
	buildHighlightLayer,
	capitalLabelLayer,
	countryLabelLayer,
	hoverLayer,
	LABELS_BOTTOM_LAYER_ID,
	SOURCE_ID,
	SOURCE_LAYER_ID,
} from './map-styles'
import type { MapRendererProps } from './types'

const MAP_STYLE_URL = '/map/style.json'

const DEFAULT_MAP_CENTER: [number, number] = [8, 18]
const DEFAULT_MAP_ZOOM = 2
const REVEALED_MAP_ZOOM = 3.4
const REVEALED_FLY_DURATION_MS = 900
const REVEALED_FLY_OFFSET: [number, number] = [0, 120]
const REVEALED_POPUP_OFFSET = 12

const INITIAL_VIEW_STATE = {
	longitude: DEFAULT_MAP_CENTER[0],
	latitude: DEFAULT_MAP_CENTER[1],
	zoom: DEFAULT_MAP_ZOOM,
}

const MAP_STYLE = { width: '100%', height: '100%' }

const INTERACTIVE_LAYER_IDS = [BASE_STYLE_LAYER_ID]

const transformRequest = (url: string) => {
	const absoluteUrl = url.startsWith('/')
		? new URL(url, window.location.origin).toString()
		: url
	return { url: absoluteUrl }
}

const MERCATOR_PROJECTION: ProjectionSpecification = { type: 'mercator' }
const GLOBE_PROJECTION: ProjectionSpecification = {
	type: 'vertical-perspective',
}

const isContinentScope = (scope: GameScope): scope is GameContinent => {
	return scope !== 'all'
}

function hasWrongHighlight(
	countryId: string,
	highlights: NonNullable<MapRendererProps['highlights']>,
): boolean {
	return highlights.some(highlight => {
		return highlight.countryId === countryId && highlight.tone === 'wrong'
	})
}

function MapRendererInner({
	onPick,
	interactiveIds,
	scope,
	highlights = [],
	markers = [],
	popup = null,
	disabled = false,
	className,
}: MapRendererProps): JSX.Element {
	const mapRef = useRef<MapRef | null>(null)

	const [isLoaded, setIsLoaded] = useState(false)
	const [hasFailure, setHasFailure] = useState(false)
	const [mapProjection, setMapProjection] =
		useState<ProjectionSpecification>(MERCATOR_PROJECTION)
	const [isPopupVisible, setIsPopupVisible] = useState(false)
	const [continentMinZoom, setContinentMinZoom] = useState<number | undefined>(
		undefined,
	)

	// Scope =================================================

	const isContinentChosen = isContinentScope(scope)
	const activePreset = isContinentChosen ? CONTINENT_VIEW_PRESETS[scope] : null

	useEffect(() => {
		if (isContinentChosen) {
			setMapProjection(MERCATOR_PROJECTION)
		}
	}, [isContinentChosen])

	useEffect(() => {
		const map = mapRef.current?.getMap()
		if (!map || !isLoaded) {
			return
		}

		if (!activePreset) {
			setContinentMinZoom(undefined)
			return
		}

		const camera = map.cameraForBounds(activePreset.focusBounds, {
			padding: activePreset.padding,
		})
		if (!camera) {
			return
		}

		setContinentMinZoom(camera.zoom)
		map.easeTo({
			center: camera.center,
			zoom: camera.zoom,
			duration: 800,
			essential: true,
		})
	}, [activePreset, isLoaded])

	// Hover =================================================

	const hoveredFeatureIdRef = useRef<string | null>(null)

	const setFeatureHoverState = useCallback(
		(countryId: string, hover: boolean) => {
			const map = mapRef.current?.getMap()
			if (!map) {
				return
			}

			try {
				map.setFeatureState(
					{
						source: SOURCE_ID,
						sourceLayer: SOURCE_LAYER_ID,
						id: countryId,
					},
					{ hover },
				)
			} catch (error) {
				console.warn('Failed to update hover state:', error)
			}
		},
		[],
	)

	const clearHover = useCallback(() => {
		const previousId = hoveredFeatureIdRef.current
		if (!previousId) {
			return
		}

		setFeatureHoverState(previousId, false)
		hoveredFeatureIdRef.current = null
	}, [setFeatureHoverState])

	useEffect(() => {
		if (disabled) {
			clearHover()
		}
	}, [clearHover, disabled])

	useEffect(() => {
		return () => {
			clearHover()
		}
	}, [clearHover])

	// Popup ================================================

	useEffect(() => {
		if (!popup) {
			setIsPopupVisible(false)
			return
		}

		if (!isLoaded) {
			setIsPopupVisible(false)
			return
		}

		const map = mapRef.current?.getMap()
		if (!map) {
			setIsPopupVisible(true)
			return
		}

		setIsPopupVisible(false)
		let handled = false
		const finalizePopup = () => {
			if (handled) {
				return
			}

			handled = true
			setIsPopupVisible(true)
		}

		const handleMoveEnd = () => {
			finalizePopup()
			map.off('moveend', handleMoveEnd)
		}

		map.on('moveend', handleMoveEnd)
		const popupRevealTimer = setTimeout(() => {
			finalizePopup()
			map.off('moveend', handleMoveEnd)
		}, REVEALED_FLY_DURATION_MS + 120)

		map.easeTo({
			essential: true,
			center: [popup.longitude, popup.latitude],
			zoom: Math.max(map.getZoom(), REVEALED_MAP_ZOOM),
			offset: REVEALED_FLY_OFFSET,
			duration: REVEALED_FLY_DURATION_MS,
			easing: t => 1 - (1 - t) ** 3,
		})

		return () => {
			window.clearTimeout(popupRevealTimer)
			map.off('moveend', handleMoveEnd)
		}
	}, [isLoaded, popup])

	// Layers ================================================

	const highlightLayer = useMemo(() => {
		return buildHighlightLayer(highlights)
	}, [highlights])

	const dimLayer = useMemo(() => {
		return buildDimLayer(interactiveIds, true)
	}, [interactiveIds])

	const labelIds = useMemo(() => {
		const ids = new Set<string>(
			highlights
				.filter(highlight => highlight.tone !== 'selected')
				.map(highlight => highlight.countryId),
		)
		if (popup?.countryId) {
			ids.add(popup.countryId)
		}
		return [...ids]
	}, [highlights, popup?.countryId])

	const labelFilter = useMemo<FilterSpecification>(() => {
		if (!labelIds.length) {
			return ['==', ['to-string', ['get', 'ISO_N3']], '__none__']
		}

		return ['in', ['to-string', ['get', 'ISO_N3']], ['literal', labelIds]]
	}, [labelIds])

	// Handlers ================================================

	const handleMapClick = useCallback(
		(event: MapLayerMouseEvent) => {
			if (disabled || !isLoaded) {
				return
			}

			const rawId = event.features?.[0]?.id
			const pickedId =
				rawId === null || rawId === undefined
					? ''
					: normalizeCountryId(rawId)

			clearHover()
			if (
				!pickedId ||
				!interactiveIds.has(pickedId) ||
				hasWrongHighlight(pickedId, highlights)
			) {
				return
			}

			onPick(pickedId)
		},
		[clearHover, disabled, interactiveIds, isLoaded, highlights, onPick],
	)

	const handleMouseMove = useCallback(
		(event: MapLayerMouseEvent) => {
			const rawId = event.features?.[0]?.id
			const hoveredId =
				rawId === null || rawId === undefined
					? null
					: normalizeCountryId(rawId)

			const prevId = hoveredFeatureIdRef.current
			if (prevId === hoveredId) {
				return
			}

			if (prevId) {
				setFeatureHoverState(prevId, false)
				hoveredFeatureIdRef.current = null
			}

			if (
				!disabled &&
				hoveredId &&
				interactiveIds.has(hoveredId) &&
				!hasWrongHighlight(hoveredId, highlights)
			) {
				setFeatureHoverState(hoveredId, true)
				hoveredFeatureIdRef.current = hoveredId
			}
		},
		[disabled, highlights, interactiveIds, setFeatureHoverState],
	)

	// Projection ================================================

	const projectionType =
		typeof mapProjection.type === 'string' ? mapProjection.type : ''
	const isMercatorProjection = projectionType === 'mercator'
	const isGlobeProjection =
		projectionType === 'globe' || projectionType === 'vertical-perspective'
	const isProjectionSwitchingRef = useRef(false)

	const switchProjection = useCallback(
		(projection: ProjectionSpecification) => {
			const map = mapRef.current?.getMap()
			clearHover()
			isProjectionSwitchingRef.current = true
			setMapProjection(projection)

			if (map) {
				map.once('idle', () => {
					isProjectionSwitchingRef.current = false
				})
			} else {
				setTimeout(() => {
					isProjectionSwitchingRef.current = false
				}, 300)
			}
		},
		[clearHover],
	)

	// Map ======================================================

	const handleLoad = useCallback(() => {
		setIsLoaded(true)
	}, [])
	const handleError = useCallback((event: ErrorEvent) => {
		console.error('Maplibre error:', event.error)
		setTimeout(() => setHasFailure(true), 0)
	}, [])

	return (
		<div
			className={`relative h-full w-full overflow-hidden ${isGlobeProjection ? 'bg-[#08162F]' : ''} ${className}`}
		>
			<Map
				ref={mapRef}
				initialViewState={INITIAL_VIEW_STATE}
				mapStyle={MAP_STYLE_URL}
				style={MAP_STYLE}
				maxBounds={activePreset?.maxBounds}
				minZoom={activePreset ? continentMinZoom : undefined}
				projection={mapProjection}
				onLoad={handleLoad}
				transformRequest={transformRequest}
				onClick={handleMapClick}
				onMouseMove={handleMouseMove}
				onMouseLeave={clearHover}
				interactiveLayerIds={INTERACTIVE_LAYER_IDS}
				onError={handleError}
			>
				<NavigationControl showCompass={false} position='top-left' />

				<Layer {...dimLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...highlightLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...hoverLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...capitalLabelLayer} filter={labelFilter} />
				<Layer {...countryLabelLayer} filter={labelFilter} />

				{markers.map(marker => (
					<Marker
						key={marker.id}
						longitude={marker.longitude}
						latitude={marker.latitude}
						anchor={marker.anchor ?? 'bottom'}
					>
						<div className='pointer-events-none'>{marker.element}</div>
					</Marker>
				))}

				{popup && isPopupVisible ? (
					<Popup
						longitude={popup.longitude}
						latitude={popup.latitude}
						offset={REVEALED_POPUP_OFFSET}
						className='revealed-popup'
						maxWidth='none'
						closeOnClick={false}
						closeButton={false}
					>
						<div>{popup.element}</div>
					</Popup>
				) : null}
			</Map>

			<div className='absolute top-3.5 left-3.5 z-10 flex flex-col gap-2'>
				<button
					type='button'
					aria-label='Плоская карта'
					title='Плоская карта'
					className={`${isMercatorProjection ? 'bg-blue-500 text-white' : 'bg-gray-500 text-slate-100'} inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg transition hover:bg-blue-700`}
					onClick={() => switchProjection(MERCATOR_PROJECTION)}
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
						aria-hidden='true'
					>
						<path d='M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z' />
						<path d='M15 5.764v15' />
						<path d='M9 3.236v15' />
					</svg>
				</button>
				<button
					type='button'
					aria-label='Глобус'
					title='Глобус'
					className={`${isGlobeProjection ? 'bg-blue-500 text-white' : 'bg-gray-500 text-slate-100'} inline-flex h-12 w-12 items-center justify-center rounded-lg transition ${isContinentChosen ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-blue-700'}`}
					onClick={() => {
						if (!isContinentChosen) {
							switchProjection(GLOBE_PROJECTION)
						}
					}}
					disabled={isContinentChosen}
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
						aria-hidden='true'
					>
						<circle cx='12' cy='12' r='10' />
						<path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' />
						<path d='M2 12h20' />
					</svg>
				</button>
			</div>

			{hasFailure ? (
				<div className='absolute top-3 left-1/2 z-11 -translate-x-1/2 rounded-lg bg-slate-900/90 px-2.5 py-2 text-xs text-white'>
					Ошибка отображения карты.
				</div>
			) : null}
		</div>
	)
}

export const MapRenderer = memo(MapRendererInner)
MapRenderer.displayName = 'MapRenderer'
