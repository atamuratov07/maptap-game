import type { FilterSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
	Layer,
	NavigationControl,
	Popup,
	type MapLayerMouseEvent,
	type MapRef,
	type ProjectionSpecification,
} from 'react-map-gl/maplibre'
import type { GameContinent, GameScope } from '../core/types'
import { normalizeCountryId } from '../data/gameData'
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
const REVEALED_POPUP_OFFSET: [number, number] = [0, -8]

const MERCATOR_PROJECTION: ProjectionSpecification = { type: 'mercator' }
const GLOBE_PROJECTION: ProjectionSpecification = {
	type: 'vertical-perspective',
}

const isContinentScope = (scope: GameScope): scope is GameContinent => {
	return scope !== 'all'
}

export function MapLibreRenderer({
	onPick,
	interactiveIds,
	scope,
	wrongIds,
	revealedInfo,
	disabled = false,
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
		if (isContinentScope(scope)) {
			setMapProjection(MERCATOR_PROJECTION)
		}
	}, [isContinentChosen, scope])

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
	}, [isLoaded, scope, activePreset])

	// Hover =================================================
	const hoveredFeatureIdRef = useRef<string | null>(null)

	const setFeatureHoverState = useCallback(
		(countryId: string, hover: boolean) => {
			const map = mapRef.current?.getMap()
			if (!map) return

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
		const prevId = hoveredFeatureIdRef.current
		if (!prevId) return
		setFeatureHoverState(prevId, false)
		hoveredFeatureIdRef.current = null
	}, [setFeatureHoverState])

	useEffect(() => {
		if (disabled) clearHover()
	}, [disabled, clearHover])

	useEffect(() => () => clearHover(), [clearHover])

	// Popup ================================================
	useEffect(() => {
		if (!revealedInfo) {
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
			if (handled) return
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
			center: [revealedInfo.longitude, revealedInfo.latitude],
			zoom: Math.max(map.getZoom(), REVEALED_MAP_ZOOM),
			offset: REVEALED_FLY_OFFSET,
			duration: REVEALED_FLY_DURATION_MS,
			easing: t => 1 - (1 - t) ** 3,
		})

		return () => {
			clearTimeout(popupRevealTimer)
			map.off('moveend', handleMoveEnd)
		}
	}, [isLoaded, revealedInfo])

	// Layers ================================================
	const highlightLayer = useMemo(() => {
		return buildHighlightLayer(revealedInfo?.countryId, wrongIds)
	}, [revealedInfo?.countryId, wrongIds])

	const dimLayer = useMemo(() => {
		return buildDimLayer(interactiveIds, true)
	}, [interactiveIds])

	const labelIds = useMemo(() => {
		const ids = new Set<string>(wrongIds)
		if (revealedInfo?.countryId) ids.add(revealedInfo?.countryId)
		return [...ids]
	}, [wrongIds, revealedInfo?.countryId])

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
				wrongIds.includes(pickedId)
			) {
				return
			}
			onPick(pickedId)
		},
		[disabled, onPick, interactiveIds, wrongIds, isLoaded, clearHover],
	)

	const handleMouseMove = useCallback(
		(event: MapLayerMouseEvent) => {
			const rawId = event.features?.[0]?.id
			const hoveredId =
				rawId === null || rawId === undefined
					? null
					: normalizeCountryId(rawId)

			const prevId = hoveredFeatureIdRef.current
			if (prevId === hoveredId) return

			if (prevId) {
				setFeatureHoverState(prevId, false)
				hoveredFeatureIdRef.current = null
			}

			if (
				!disabled &&
				hoveredId &&
				interactiveIds.has(hoveredId) &&
				!wrongIds.includes(hoveredId)
			) {
				setFeatureHoverState(hoveredId, true)
				hoveredFeatureIdRef.current = hoveredId
			}
		},
		[disabled, interactiveIds, wrongIds, setFeatureHoverState],
	)

	// Projection ================================================
	const projectionType =
		typeof mapProjection.type === 'string' ? mapProjection.type : ''
	const isMercatorProjection = projectionType === 'mercator'
	const isGlobeProjection =
		projectionType === 'globe' || projectionType === 'vertical-perspective'

	return (
		<div
			className={`relative h-full w-full pt-15 overflow-hidden ${isGlobeProjection ? 'bg-[#08162F]' : ''}`}
		>
			<Map
				ref={mapRef}
				initialViewState={{
					longitude: DEFAULT_MAP_CENTER[0],
					latitude: DEFAULT_MAP_CENTER[1],
					zoom: DEFAULT_MAP_ZOOM,
				}}
				mapStyle={MAP_STYLE_URL}
				style={{ width: '100%', height: '100%' }}
				maxBounds={activePreset?.maxBounds}
				minZoom={activePreset ? continentMinZoom : undefined}
				projection={mapProjection}
				onLoad={() => setIsLoaded(true)}
				transformRequest={url => {
					const absoluteUrl = url.startsWith('/')
						? new URL(url, window.location.origin).toString()
						: url

					return { url: absoluteUrl }
				}}
				onClick={handleMapClick}
				onMouseMove={handleMouseMove}
				onMouseLeave={clearHover}
				interactiveLayerIds={[BASE_STYLE_LAYER_ID]}
				onError={e => {
					console.error('MapLibre error:', e.error)
					setTimeout(() => setHasFailure(true), 0)
				}}
			>
				<NavigationControl showCompass={false} position='top-right' />

				<Layer {...dimLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...highlightLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...hoverLayer} beforeId={LABELS_BOTTOM_LAYER_ID} />
				<Layer {...capitalLabelLayer} filter={labelFilter} />
				<Layer {...countryLabelLayer} filter={labelFilter} />

				{revealedInfo && isPopupVisible && (
					<Popup
						anchor='bottom'
						longitude={revealedInfo.longitude}
						latitude={revealedInfo.latitude}
						offset={REVEALED_POPUP_OFFSET}
						className='revealed-popup'
						maxWidth='none'
						closeOnClick={false}
						closeButton={false}
					>
						<div>{revealedInfo.element}</div>
					</Popup>
				)}
			</Map>
			<div className='absolute bottom-3.5 left-3.5 flex items-center gap-2 z-10'>
				<button
					className={`${isMercatorProjection ? 'bg-blue-500 cursor-pointer' : 'bg-gray-500'} hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
					onClick={() => {
						setMapProjection(MERCATOR_PROJECTION)
					}}
				>
					2D
				</button>
				<button
					className={`${isGlobeProjection ? 'bg-blue-500 cursor-pointer' : 'bg-gray-500'} ${isContinentChosen ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-blue-700'} hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
					onClick={() => {
						if (!isContinentChosen) {
							setMapProjection(GLOBE_PROJECTION)
						}
					}}
					disabled={isContinentChosen}
				>
					3D
				</button>
			</div>
			{hasFailure ? (
				<div className='absolute top-3 left-1/2 z-11 -translate-x-1/2 rounded-lg bg-slate-900/90 px-2.5 py-2 text-xs text-white'>
					Сбой рендера MapLibre.
				</div>
			) : null}
		</div>
	)
}
