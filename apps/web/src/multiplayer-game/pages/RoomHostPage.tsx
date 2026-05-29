import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { RoomFinishedScreen } from '../finished/RoomFinishedScreen'
import { ActiveGameScreen } from '../game/ActiveGameScreen'
import { RoomLobbyScreen } from '../lobby/RoomLobbyScreen'
import { RoomClosedScreen } from '../screens/RoomClosedScreen'
import { RoomErrorScreen } from '../screens/RoomErrorScreen'
import { RoomLoadingScreen } from '../screens/RoomLoadingScreen'
import { useRoomHostController } from '../session/useRoomHostController'

export function RoomHostPage(): JSX.Element {
	const { t } = useTranslation()
	const params = useParams<{ roomCode: string }>()
	const navigate = useNavigate()
	const roomCode = (params.roomCode ?? '').trim().toUpperCase()
	const {
		state,
		actionPending,
		actionErrorMessage,
		startGame,
		submitAnswer,
		returnToLobby,
		terminateRoom,
		retry,
	} = useRoomHostController(roomCode)
	const closedReason = state.status === 'closed' ? state.reason : null

	useEffect(() => {
		if (closedReason === 'host_terminated') {
			navigate('/multiplayer', { replace: true })
		}
	}, [closedReason, navigate])

	if (state.status === 'connecting') {
		return (
			<RoomLoadingScreen
				label={t('multiplayer.room')}
				title={t('multiplayer.loading.connecting')}
				message={t('multiplayer.loading.connectingMessage')}
			/>
		)
	}

	if (state.status === 'closed') {
		if (state.reason === 'host_terminated') {
			return (
				<RoomLoadingScreen
					label={t('multiplayer.room')}
					title={t('multiplayer.loading.closed')}
					message={t('multiplayer.loading.closedRedirect')}
				/>
			)
		}

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

	const room = state.room
	const isReconnecting = state.status === 'reconnecting'

	if (!room) {
		return (
			<RoomLoadingScreen
				label={t('multiplayer.room')}
				title={t('multiplayer.loading.reconnecting')}
				message={t('multiplayer.loading.reconnectingMessage')}
			/>
		)
	}

	if (room.phase === 'lobby') {
		return (
			<RoomLobbyScreen
				role='host'
				roomCode={roomCode}
				members={room.members}
				startPending={actionPending === 'start'}
				terminatePending={actionPending === 'terminate-room'}
				actionErrorMessage={actionErrorMessage}
				isReconnecting={isReconnecting}
				onStartGame={gameConfig => {
					void startGame(gameConfig)
				}}
				onTerminateRoom={() => {
					void terminateRoom()
				}}
			/>
		)
	}

	if (room.phase === 'finished') {
		return (
			<RoomFinishedScreen
				room={room}
				capabilities={{
					canPlayAgain: true,
					canTerminateRoom: true,
					canLeaveRoom: false,
				}}
				isReconnecting={isReconnecting}
				playAgainPending={actionPending === 'return-lobby'}
				terminatePending={actionPending === 'terminate-room'}
				actionErrorMessage={actionErrorMessage}
				onPlayAgain={() => {
					void returnToLobby()
				}}
				onTerminateRoom={() => {
					void terminateRoom()
				}}
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
