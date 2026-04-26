import { useParams } from 'react-router-dom'
import { RoomFinishedScreen } from '../finished/RoomFinishedScreen'
import { ActiveGameScreen } from '../game/ActiveGameScreen'
import { PlayerJoinScreen } from '../join/PlayerJoinScreen'
import { RoomLobbyScreen } from '../lobby/RoomLobbyScreen'
import { RoomClosedScreen } from '../screens/RoomClosedScreen'
import { RoomErrorScreen } from '../screens/RoomErrorScreen'
import { RoomLoadingScreen } from '../screens/RoomLoadingScreen'
import { useRoomPlayerController } from '../session/useRoomPlayerController'

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
	} = useRoomPlayerController(roomCode)

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
				roomCode={roomCode}
				members={room.members}
				actionErrorMessage={actionErrorMessage}
				isReconnecting={isReconnecting}
			/>
		)
	}

	if (room.phase === 'finished') {
		return (
			<RoomFinishedScreen
				room={room}
				capabilities={{
					canPlayAgain: false,
					canTerminateRoom: false,
					canLeaveRoom: true,
				}}
				isReconnecting={isReconnecting}
			/>
		)
	}

	return (
		<div className='fixed inset-0 overflow-hidden bg-slate-950'>
			<ActiveGameScreen
				game={room.activeGame}
				members={room.members}
				submitPending={actionPending === 'submit'}
				actionErrorMessage={actionErrorMessage}
				isReconnecting={isReconnecting}
				onSubmitAnswer={submitAnswer}
			/>
		</div>
	)
}
