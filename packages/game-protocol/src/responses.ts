import { z } from 'zod'

import {
	ROOM_PHASES,
	type PlayerId,
	type PlayerRole,
	type RoomCode,
	type RoomHostView,
	type RoomId,
	type RoomPlayerView,
} from '@maptap/game-domain/multiplayer'

export const roomPhaseSchema = z.enum(ROOM_PHASES)

export interface SessionIdentity {
	roomId: RoomId
	roomCode: RoomCode
	playerId: PlayerId
	role: PlayerRole
	playerSessionToken: string
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
	playerCount: z.number().int().nonnegative(),
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
	playerId: PlayerId
	snapshot: RoomHostView
}

export interface ResumePlayerRoomResponse {
	roomId: RoomId
	playerId: PlayerId
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
