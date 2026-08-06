import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RoomFinishedScreen } from '../finished/RoomFinishedScreen'
import { RoomLobbyScreen } from '../lobby/RoomLobbyScreen'
import { RoomClosedScreen } from '../screens/RoomClosedScreen'
import { RoomErrorScreen } from '../screens/RoomErrorScreen'
import { RoomLoadingScreen } from '../screens/RoomLoadingScreen'
import { ActiveGameParticipantScreen } from '../game/ActiveGameParticipantScreen'
import { useRoomHostController } from '../session/useRoomHostController'
import { useGroupHostActions } from '../session/useGroupHostActions'
import { ActiveGameHostScreen } from '../game/ActiveGameHostScreen'
import { useClassroomHostActions } from '../session/useClassroomHostActions'

export function RoomHostPage(): JSX.Element {
	const params = useParams<{ roomCode: string }>()
	const navigate = useNavigate()
	const roomCode = (params.roomCode ?? '').trim().toUpperCase()
	const {
		state,
		gateway,
		actionPending,
		actionErrorMessage,
		runAction,
		startGame,
		returnToLobby,
		terminateRoom,
		retry,
	} = useRoomHostController(roomCode)

	const { submitAnswer } = useGroupHostActions({
		state,
		gateway,
		runAction,
	})
	const { revealRound, advanceRound } = useClassroomHostActions({
		state,
		gateway,
		runAction,
	})

	const closedReason = state.status === 'closed' ? state.reason : null

	useEffect(() => {
		if (closedReason === 'host_terminated') {
			navigate('/multiplayer', { replace: true })
		}
	}, [closedReason, navigate])

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
		if (state.reason === 'host_terminated') {
			return (
				<RoomLoadingScreen
					label='Комната'
					title='Комната закрыта'
					message='Возвращаемся на страницу мультиплеера.'
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
				label='Комната'
				title='Переподключение'
				message='Возвращаем вас в игру.'
			/>
		)
	}

	const requireQuestionDuration = room.roomMode === 'group'
	if (room.phase === 'lobby') {
		return (
			<RoomLobbyScreen
				role='host'
				roomCode={roomCode}
				requireQuestionDuration={requireQuestionDuration}
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

	if (room.roomMode === 'group') {
		return (
			<div className='fixed inset-0 overflow-hidden bg-slate-950'>
				<ActiveGameParticipantScreen
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

	return (
		<ActiveGameHostScreen
			game={room.activeGame}
			members={room.members}
			onRevealRound={revealRound}
			onAdvanceRound={advanceRound}
			isReconnecting={isReconnecting}
			revealPending={actionPending === 'reveal'}
			advancePending={actionPending === 'advance'}
			actionErrorMessage={actionErrorMessage}
		/>
	)
}
