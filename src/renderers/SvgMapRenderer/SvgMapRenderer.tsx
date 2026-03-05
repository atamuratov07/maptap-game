import { geoCentroid } from 'd3-geo'
import type { FeatureCollection, Geometry } from 'geojson'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	ComposableMap,
	Geographies,
	Geography,
	Marker,
	ZoomableGroup,
} from 'react-simple-maps'
import type { MapRendererProps } from '../types'

const NEUTRAL_FILL = '#f7e4c1'
const WRONG_FILL = '#f87171'
const REVEALED_FILL = '#22c55e'
const MIN_MAP_ZOOM = 1
const MAX_MAP_ZOOM = 8
const REVEAL_MAP_ZOOM = 3.4
const MIN_OVERLAY_UI_SCALE = 0.9
const MAX_OVERLAY_UI_SCALE = 1.25

interface MapViewState {
	coordinates: [number, number]
	zoom: number
}

interface ZoomEventLike {
	type?: string
	ctrlKey?: boolean
	button?: number
	pointerType?: string
}

const DEFAULT_MAP_VIEW: MapViewState = {
	coordinates: [0, 20],
	zoom: 1,
}
const REVEAL_ZOOM_DURATION_MS = 650

function getFillColor(
	countryId: string,
	revealedId: string | undefined,
	wrongIds: Set<string>,
): string {
	if (revealedId === countryId) {
		return REVEALED_FILL
	}

	if (wrongIds.has(countryId)) {
		return WRONG_FILL
	}

	return NEUTRAL_FILL
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

function getOverlayUiScaleFromZoom(zoom: number): number {
	const normalized = clamp(
		(zoom - MIN_MAP_ZOOM) / (REVEAL_MAP_ZOOM - MIN_MAP_ZOOM),
		0,
		1,
	)
	return (
		MIN_OVERLAY_UI_SCALE +
		(MAX_OVERLAY_UI_SCALE - MIN_OVERLAY_UI_SCALE) * normalized
	)
}

export function SvgMapRenderer({
	features,
	onPick,
	highlighted,
	wrongChoiceLabels,
	pinned,
	disabled = false,
}: MapRendererProps): JSX.Element {
	const [mapView, setMapView] = useState<MapViewState>(DEFAULT_MAP_VIEW)
	const [lastAutoFocusedRevealId, setLastAutoFocusedRevealId] = useState<
		string | undefined
	>(undefined)

	const mapViewRef = useRef<MapViewState>(DEFAULT_MAP_VIEW)
	const animationFrameRef = useRef<number | null>(null)

	const wrongSet = useMemo(
		() => new Set(highlighted.wrongIds),
		[highlighted.wrongIds],
	)

	const geographyCollection = useMemo<
		FeatureCollection<Geometry, Record<string, unknown>>
	>(
		() => ({
			type: 'FeatureCollection',
			features,
		}),
		[features],
	)

	const pinnedCoordinates = useMemo<[number, number] | null>(() => {
		if (!pinned) {
			return null
		}

		const pinnedFeature = features.find(item => item.id === pinned.countryId)
		if (!pinnedFeature) {
			return null
		}

		const [longitude, latitude] = geoCentroid(pinnedFeature)
		if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
			return null
		}

		return [longitude, latitude]
	}, [features, pinned])

	const revealedCoordinates = useMemo<[number, number] | null>(() => {
		if (!highlighted.revealedId) {
			return null
		}

		const revealedFeature = features.find(
			item => item.id === highlighted.revealedId,
		)
		if (!revealedFeature) {
			return null
		}

		const [longitude, latitude] = geoCentroid(revealedFeature as never)
		if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
			return null
		}

		return [longitude, latitude]
	}, [features, highlighted.revealedId])

	const wrongLabelMarkers = useMemo<
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

	const canUseForeignObject =
		typeof window === 'undefined' || 'SVGForeignObjectElement' in window
	const overlayUiScale = useMemo(
		() => getOverlayUiScaleFromZoom(mapView.zoom),
		[mapView.zoom],
	)
	const overlayLocalScale = overlayUiScale / mapView.zoom

	const pinCardPlacement = useMemo(() => {
		const cardWidth = 244
		const cardHeight = 210
		if (!pinnedCoordinates) {
			return {
				x: -cardWidth / 2,
				y: -206,
				width: cardWidth,
				height: cardHeight,
				fallbackTransform: 'translate(-82,-146)',
			}
		}

		const latitude = pinnedCoordinates[1]
		if (latitude > 45) {
			return {
				x: -cardWidth / 2,
				y: 34,
				width: cardWidth,
				height: cardHeight,
				fallbackTransform: 'translate(-82,24)',
			}
		}

		return {
			x: -cardWidth / 2,
			y: -206,
			width: cardWidth,
			height: cardHeight,
			fallbackTransform: 'translate(-82,-146)',
		}
	}, [pinnedCoordinates])

	useEffect(() => {
		mapViewRef.current = mapView
	}, [mapView])

	useEffect(() => {
		return () => {
			if (animationFrameRef.current !== null) {
				window.cancelAnimationFrame(animationFrameRef.current)
			}
		}
	}, [])

	useEffect(() => {
		if (!highlighted.revealedId || !revealedCoordinates) {
			return
		}

		if (lastAutoFocusedRevealId === highlighted.revealedId) {
			return
		}

		if (animationFrameRef.current !== null) {
			window.cancelAnimationFrame(animationFrameRef.current)
			animationFrameRef.current = null
		}

		const startView = mapViewRef.current
		const targetView: MapViewState = {
			coordinates: revealedCoordinates,
			zoom: Math.max(REVEAL_MAP_ZOOM, startView.zoom),
		}
		const startedAt = performance.now()

		const tick = (timestamp: number): void => {
			const rawProgress = (timestamp - startedAt) / REVEAL_ZOOM_DURATION_MS
			const progress = Math.max(0, Math.min(1, rawProgress))
			const eased = 1 - (1 - progress) ** 3

			setMapView({
				coordinates: [
					startView.coordinates[0] +
						(targetView.coordinates[0] - startView.coordinates[0]) *
							eased,
					startView.coordinates[1] +
						(targetView.coordinates[1] - startView.coordinates[1]) *
							eased,
				],
				zoom: startView.zoom + (targetView.zoom - startView.zoom) * eased,
			})

			if (progress < 1) {
				animationFrameRef.current = window.requestAnimationFrame(tick)
				return
			}

			animationFrameRef.current = null
			setLastAutoFocusedRevealId(highlighted.revealedId)
		}

		animationFrameRef.current = window.requestAnimationFrame(tick)

		return () => {
			if (animationFrameRef.current !== null) {
				window.cancelAnimationFrame(animationFrameRef.current)
				animationFrameRef.current = null
			}
		}
	}, [highlighted.revealedId, lastAutoFocusedRevealId, revealedCoordinates])

	const handleMoveStart = useCallback(() => {
		if (animationFrameRef.current !== null) {
			window.cancelAnimationFrame(animationFrameRef.current)
			animationFrameRef.current = null
		}
	}, [])

	const handleMoveEnd = useCallback(
		(position: { coordinates: [number, number]; zoom: number }) => {
			setMapView({
				coordinates: [position.coordinates[0], position.coordinates[1]],
				zoom: position.zoom,
			})
		},
		[],
	)

	const handleZoomIn = useCallback(() => {
		setMapView(prev => ({
			...prev,
			zoom: Math.min(MAX_MAP_ZOOM, prev.zoom + 0.8),
		}))
	}, [])

	const handleZoomOut = useCallback(() => {
		setMapView(prev => ({
			...prev,
			zoom: Math.max(MIN_MAP_ZOOM, prev.zoom - 0.8),
		}))
	}, [])

	const handleResetView = useCallback(() => {
		setMapView(DEFAULT_MAP_VIEW)
	}, [])

	const filterZoomEvent = useCallback((event: ZoomEventLike): boolean => {
		const type = event.type ?? ''
		if (type.startsWith('touch')) {
			return true
		}

		if (type.startsWith('pointer') && event.pointerType === 'touch') {
			return true
		}

		if (type === 'wheel') {
			return true
		}

		if (event.button !== undefined && event.button !== 0) {
			return false
		}

		return !event.ctrlKey
	}, [])

	return (
		<div className='relative h-full w-full touch-none overflow-hidden bg-[#90DFFE]'>
			<div className='absolute top-4 right-4 z-13 flex flex-col gap-2'>
				<button
					type='button'
					className='h-10 w-10 cursor-pointer rounded-lg border border-slate-300 bg-white/95 text-[22px] leading-none font-bold text-slate-900 transition hover:bg-white'
					onClick={handleZoomIn}
					aria-label='Zoom in'
				>
					+
				</button>
				<button
					type='button'
					className='h-10 w-10 cursor-pointer rounded-lg border border-slate-300 bg-white/95 text-[22px] leading-none font-bold text-slate-900 transition hover:bg-white'
					onClick={handleZoomOut}
					aria-label='Zoom out'
				>
					-
				</button>
				<button
					type='button'
					className='h-10 w-10 cursor-pointer rounded-lg border border-slate-300 bg-white/95 text-[13px] leading-none font-bold text-slate-900 transition hover:bg-white'
					onClick={handleResetView}
					aria-label='Reset zoom'
				>
					1:1
				</button>
			</div>

			<ComposableMap
				projection='geoEqualEarth'
				className='h-full w-full touch-none'
			>
				<ZoomableGroup
					center={mapView.coordinates}
					zoom={mapView.zoom}
					minZoom={MIN_MAP_ZOOM}
					maxZoom={MAX_MAP_ZOOM}
					filterZoomEvent={
						filterZoomEvent as unknown as (element: SVGElement) => boolean
					}
					onMoveStart={handleMoveStart}
					onMoveEnd={handleMoveEnd}
				>
					<Geographies geography={geographyCollection}>
						{({ geographies }) =>
							geographies.map(
								(geography: {
									id?: string | number
									rsmKey: string
								}) => {
									const id = String(geography.id ?? '')
									if (!id) {
										return null
									}

									const fill = getFillColor(
										id,
										highlighted.revealedId,
										wrongSet,
									)
									const isDisabledCountry =
										disabled || wrongSet.has(id)

									return (
										<Geography
											key={geography.rsmKey}
											geography={geography as never}
											onClick={() => {
												if (!isDisabledCountry) {
													onPick(id)
												}
											}}
											style={{
												default: {
													fill,
													stroke: '#2a2a2a',
													strokeWidth: 0.35,
													outline: 'none',
													cursor: isDisabledCountry
														? 'not-allowed'
														: 'pointer',
												},
												hover: isDisabledCountry
													? {
															cursor: 'not-allowed',
															outline: 'none',
															fill,
															stroke: '#2a2a2a',
															strokeWidth: 0.35,
														}
													: {
															fill: '#FB9EB9',
															stroke: '#FF1493',
															strokeWidth: 0.55,
															outline: 'none',
															cursor: 'pointer',
														},
												pressed: {
													fill,
													stroke: '#1e293b',
													strokeWidth: 0.7,
													outline: 'none',
													cursor: isDisabledCountry
														? 'not-allowed'
														: 'pointer',
												},
											}}
										/>
									)
								},
							)
						}
					</Geographies>

					{wrongLabelMarkers.map(item => (
						<Marker
							key={`wrong-label-${item.countryId}`}
							coordinates={item.coordinates}
						>
							<g
								transform={`scale(${overlayLocalScale})`}
								pointerEvents='none'
							>
								{canUseForeignObject ? (
									<foreignObject
										x={-88}
										y={-36}
										width={176}
										height={30}
										pointerEvents='none'
									>
										<div className='mx-auto w-max max-w-44 overflow-hidden text-ellipsis whitespace-nowrap rounded-full bg-red-900/90 px-2.5 py-1 text-center text-xs leading-[1.15] font-semibold text-red-100'>
											{item.label}
										</div>
									</foreignObject>
								) : (
									<g
										transform='translate(-70,-22)'
										pointerEvents='none'
									>
										<rect
											width='140'
											height='24'
											rx='12'
											fill='#7f1d1d'
											opacity='0.9'
										/>
										<text
											x='70'
											y='16'
											fontSize='11'
											fill='#fee2e2'
											textAnchor='middle'
										>
											{item.label}
										</text>
									</g>
								)}
							</g>
						</Marker>
					))}

					{pinned && pinnedCoordinates ? (
						<Marker coordinates={pinnedCoordinates}>
							<g
								transform={`scale(${overlayLocalScale})`}
								pointerEvents='none'
							>
								{canUseForeignObject ? (
									<foreignObject
										x={pinCardPlacement.x}
										y={pinCardPlacement.y}
										width={pinCardPlacement.width}
										height={pinCardPlacement.height}
										pointerEvents='none'
									>
										<div className='pointer-events-none'>
											{pinned.element}
										</div>
									</foreignObject>
								) : (
									<g
										transform={pinCardPlacement.fallbackTransform}
										pointerEvents='none'
									>
										<rect
											width='164'
											height='48'
											rx='8'
											fill='#ffffff'
											stroke='#334155'
										/>
										<text x='12' y='30' fontSize='12' fill='#0f172a'>
											Answer revealed
										</text>
									</g>
								)}
							</g>
						</Marker>
					) : null}
				</ZoomableGroup>
			</ComposableMap>
		</div>
	)
}
