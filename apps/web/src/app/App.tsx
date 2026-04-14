import { Navigate, Route, Routes } from 'react-router'
import {
	MultiplayerHomePage,
	MultiplayerRoomHostPage,
	MultiplayerRoomPlayerPage,
} from '../multiplayer-game'
import {
	SingleplayerGamePage,
	SingleplayerSetupPage,
} from '../singleplayer-game'
import { HomePage } from './HomePage'

export default function App(): JSX.Element {
	return (
		<Routes>
			<Route path='/' element={<HomePage />} />
			<Route path='/singleplayer' element={<SingleplayerSetupPage />} />
			<Route path='/singleplayer/play' element={<SingleplayerGamePage />} />
			<Route path='/multiplayer' element={<MultiplayerHomePage />} />
			<Route
				path='/multiplayer/room/:roomCode'
				element={<MultiplayerRoomPlayerPage />}
			/>
			<Route
				path='/multiplayer/host/:roomCode'
				element={<MultiplayerRoomHostPage />}
			/>
			<Route path='*' element={<Navigate to='/' replace />} />
		</Routes>
	)
}
