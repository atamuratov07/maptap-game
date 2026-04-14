import { useParams } from 'react-router'
import { RoomGameScene } from '../components/game/GameScene'
import { PlayerJoinScreen } from '../components/screens/PlayerJoinScreen'
import { RoomClosedScreen } from '../components/screens/RoomClosedScreen'
import { RoomErrorScreen } from '../components/screens/RoomErrorScreen'
import { RoomFinishedScreen } from '../components/screens/RoomFinishedScreen'
import { RoomLoadingScreen } from '../components/screens/RoomLoadingScreen'
import { RoomLobbyScreen } from '../components/screens/RoomLobbyScreen'
import { useRoomPlayerSession } from '../core/usePlayerSession'

export function RoomPlayerPage(): JSX.Element {
	const params = useParams<{ roomCode: string }>()
	const roomCode = (params.roomCode ?? '').trim().toUpperCase()
	const {
		state,
		actionPending,
		actionErrorMessage,
		joinRoom,
		submitAnswer,
		retry,
	} = useRoomPlayerSession(roomCode)

	if (state.status === 'connecting') {
		return (
			<RoomLoadingScreen
				label='Комната'
				title='Подключение'
				message='Подключаемся к игре.'
			/>
		)
	}

	if (state.status === 'closed') {
		return <RoomClosedScreen reason={state.reason} />
	}

	if (state.status === 'error') {
		return (
			<RoomErrorScreen
				message={state.message}
				onRetry={() => {
					void retry()
				}}
			/>
		)
	}

	if (state.status === 'idle') {
		return (
			<PlayerJoinScreen
				hostName={state.roomInfo.hostName}
				joinable={state.roomInfo.joinable}
				pending={actionPending === 'join'}
				submitError={actionErrorMessage}
				resumeMessage={state.resumeMessage}
				onJoin={joinRoom}
			/>
		)
	}

	const room = state.room
	const isReconnecting = state.status === 'reconnecting'

	if (!room) {
		return (
			<RoomLoadingScreen
				label='Комната'
				title='Переподключение'
				message='Возвращаем вас в игру.'
			/>
		)
	}

	if (room.phase === 'lobby') {
		return (
			<RoomLobbyScreen
				role='player'
				actionErrorMessage={actionErrorMessage}
				isReconnecting={isReconnecting}
			/>
		)
	}

	if (room.phase === 'finished') {
		return <RoomFinishedScreen room={room} isReconnecting={isReconnecting} />
	}

	return (
		<RoomGameScene
			room={room}
			submitPending={actionPending === 'submit'}
			actionErrorMessage={actionErrorMessage}
			isReconnecting={isReconnecting}
			onSubmitAnswer={submitAnswer}
		/>
	)
}
