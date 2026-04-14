import type { AckCallback, EmptyAckData } from './ack'
import type {
	CreateRoomRequest,
	JoinRoomRequest,
	LookupRoomRequest,
	ResumeHostRoomRequest,
	ResumePlayerRoomRequest,
	StartGameRequest,
	SubmitAnswerRequest,
} from './requests'
import type {
	CreateRoomResponse,
	HostRoomSnapshotEvent,
	JoinRoomResponse,
	LookupRoomResponse,
	PlayerRoomSnapshotEvent,
	ResumeHostRoomResponse,
	ResumePlayerRoomResponse,
	RoomClosedEvent,
	SubmitAnswerResponse,
} from './responses'

export const GAME_NAMESPACE = '/game' as const

export interface ClientToServerEvents {
	'room:create': (
		payload: CreateRoomRequest,
		ack: AckCallback<CreateRoomResponse>,
	) => void
	'room:lookup': (
		payload: LookupRoomRequest,
		ack: AckCallback<LookupRoomResponse>,
	) => void
	'room:join': (
		payload: JoinRoomRequest,
		ack: AckCallback<JoinRoomResponse>,
	) => void
	'room:host-resume': (
		payload: ResumeHostRoomRequest,
		ack: AckCallback<ResumeHostRoomResponse>,
	) => void
	'room:player-resume': (
		payload: ResumePlayerRoomRequest,
		ack: AckCallback<ResumePlayerRoomResponse>,
	) => void
	'game:start': (
		payload: StartGameRequest,
		ack: AckCallback<EmptyAckData>,
	) => void
	'game:submit-answer': (
		payload: SubmitAnswerRequest,
		ack: AckCallback<SubmitAnswerResponse>,
	) => void
}

export interface ServerToClientEvents {
	'room:host-snapshot': (payload: HostRoomSnapshotEvent) => void
	'room:player-snapshot': (payload: PlayerRoomSnapshotEvent) => void
	'room:closed': (payload: RoomClosedEvent) => void
}

export interface InterServerEvents {}
