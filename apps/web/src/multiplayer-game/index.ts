import { lazy } from 'react'

export const MultiplayerHomePage = lazy(() => import('./pages/HomePage'))
export const MultiplayerRoomHostPage = lazy(
	() => import('./pages/RoomHostPage'),
)
export const MultiplayerRoomPlayerPage = lazy(
	() => import('./pages/RoomPlayerPage'),
)
