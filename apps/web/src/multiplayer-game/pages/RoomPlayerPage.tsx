import { useParams } from 'react-router-dom'
import { RoomFinishedScreen } from '../finished/RoomFinishedScreen'
import { ActiveGameParticipantScreen } from '../game/ActiveGameParticipantScreen'
import { PlayerJoinScreen } from '../join/PlayerJoinScreen'
import { RoomLobbyScreen } from '../lobby/RoomLobbyScreen'
import { RoomClosedScreen } from '../screens/RoomClosedScreen'
import { RoomErrorScreen } from '../screens/RoomErrorScreen'
import { RoomLoadingScreen } from '../screens/RoomLoadingScreen'
import { useRoomPlayerController } from '../session/useRoomPlayerController'
import { AnimatePresence } from 'motion/react'
import { FloatingNotice } from '../../shared/ui/FloatingNotice'
import { useEffect, useRef, useState } from 'react'
import { CheckIcon, LoaderIcon } from 'lucide-react'

function HostConnectionNotice({ hostConnected }: { hostConnected?: boolean }) {
	const [notice, setNotice] = useState<'disconnected' | 'reconnected' | null>(
		null,
	)
	const prevHostConnected = useRef<boolean | undefined>(undefined)

	useEffect(() => {
		if (!hostConnected) {
			setNotice('disconnected')
		} else if (prevHostConnected.current === false) {
			setNotice('reconnected')
			const timer = setTimeout(() => {
				setNotice(current => (current === 'disconnected' ? null : current))
			}, 1000)

			return () => clearTimeout(timer)
		} else {
			setNotice(null)
		}

		prevHostConnected.current = hostConnected
	}, [hostConnected])
	return (
		<>
			{notice === 'reconnected' && (
				<AnimatePresence mode='wait'>
					<FloatingNotice
						tone='neutral'
						offsetTop='compact'
						className='flex gap-2 items-center'
					>
						<CheckIcon className='text-xl stroke-3' />
						<p>Сессия хоста возоблена</p>
					</FloatingNotice>
				</AnimatePresence>
			)}
			{notice === 'disconnected' && (
				<AnimatePresence mode='wait'>
					<FloatingNotice
						tone='error'
						offsetTop='compact'
						className='flex gap-2 items-center'
					>
						<LoaderIcon className='animate-spin text-xl stroke-3' />
						<p>
							Хост отключился от игры
							<br />
							Ожидаем переподключения
						</p>
					</FloatingNotice>
				</AnimatePresence>
			)}
		</>
	)
}

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

	const hostConnected = room.members.find(member => member.isHost)?.connected

	const renderHostConnectionStatus =
		room.roomMode === 'classroom' ? (
			<HostConnectionNotice hostConnected={hostConnected} />
		) : null

	if (room.phase === 'lobby') {
		return (
			<>
				{renderHostConnectionStatus}

				<RoomLobbyScreen
					role='player'
					roomCode={roomCode}
					members={room.members}
					actionErrorMessage={actionErrorMessage}
					isReconnecting={isReconnecting}
				/>
			</>
		)
	}

	if (room.phase === 'finished') {
		return (
			<>
				{renderHostConnectionStatus}

				<RoomFinishedScreen
					room={room}
					capabilities={{
						canPlayAgain: false,
						canTerminateRoom: false,
						canLeaveRoom: true,
					}}
					isReconnecting={isReconnecting}
				/>
			</>
		)
	}

	return (
		<div className='fixed inset-0 overflow-hidden bg-slate-950'>
			{renderHostConnectionStatus}

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
