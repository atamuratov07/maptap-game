import {
	ROOM_PHASES,
	type MemberId,
	type RoomCode,
	type RoomHostView,
	type RoomId,
	type RoomMemberRole,
	type RoomPlayerView,
} from '@maptap/game-domain/multiplayer-next/room'

import { z } from 'zod'
export const roomPhaseSchema = z.enum(ROOM_PHASES)

export interface SessionIdentity {
	roomId: RoomId
	roomCode: RoomCode
	memberId: MemberId
	role: RoomMemberRole
	memberSessionToken: string
}

export interface CreateRoomResponse extends SessionIdentity {
	snapshot: RoomHostView
}

export const lookupRoomMissingResponseSchema = z.object({
	exists: z.literal(false),
	roomCode: z.string().trim().length(6),
})

export const lookupRoomFoundResponseSchema = z.object({
	exists: z.literal(true),
	roomCode: z.string().trim().length(6),
	phase: roomPhaseSchema,
	joinable: z.boolean(),
	memberCount: z.number().int().nonnegative(),
	hostName: z.string().trim().min(1),
})

export const lookupRoomResponseSchema = z.discriminatedUnion('exists', [
	lookupRoomMissingResponseSchema,
	lookupRoomFoundResponseSchema,
])

export type LookupRoomMissingResponse = z.infer<
	typeof lookupRoomMissingResponseSchema
>

export type LookupRoomFoundResponse = z.infer<
	typeof lookupRoomFoundResponseSchema
>

export type LookupRoomResponse = z.infer<typeof lookupRoomResponseSchema>

export interface JoinRoomResponse extends SessionIdentity {
	snapshot: RoomPlayerView
}

export type ResumeHostRoomResponse = {
	roomId: RoomId
	memberId: MemberId
	snapshot: RoomHostView
}

export interface ResumePlayerRoomResponse {
	roomId: RoomId
	memberId: MemberId
	snapshot: RoomPlayerView
}

export interface SubmitAnswerResponse {
	acceptedAt: number
}

export type HostRoomSnapshotEvent = {
	roomId: RoomId
	snapshot: RoomHostView
}

export interface PlayerRoomSnapshotEvent {
	roomId: RoomId
	snapshot: RoomPlayerView
}

export interface RoomClosedEvent {
	roomId: RoomId
	reason: 'host_terminated' | 'expired' | 'server_shutdown'
}
