import { z } from 'zod'

import { GAME_DIFFICULTIES, GAME_SCOPES } from '@maptap/game-domain'

export const difficultySchema = z.enum(GAME_DIFFICULTIES)
export const scopeSchema = z.enum(GAME_SCOPES)
export const roomCodeSchema = z
	.string()
	.trim()
	.length(6)
	.transform(value => value.toUpperCase())

export const createRoomRequestSchema = z.object({
	hostName: z.string().trim().min(1).max(20),
})

export const lookupRoomRequestSchema = z.object({
	roomCode: roomCodeSchema,
})

export const joinRoomRequestSchema = z.object({
	roomCode: roomCodeSchema,
	memberName: z.string().trim().min(1).max(20),
})

export const resumeHostRoomRequestSchema = z.object({
	memberSessionToken: z.string().min(1),
})

export const resumePlayerRoomRequestSchema = z.object({
	memberSessionToken: z.string().min(1),
})

export const returnToLobbyRequestSchema = z.object({})

export const startGameRequestSchema = z.object({
	gameConfig: z.object({
		questionCount: z.number().int().min(1).max(50),
		difficulty: difficultySchema,
		scope: scopeSchema,
		questionDurationMs: z.number().int().min(5_000).max(120_000),
	}),
})

export const submitAnswerRequestSchema = z.object({
	countryId: z.string().regex(/^\d{3}$/),
})

export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>
export type LookupRoomRequest = z.infer<typeof lookupRoomRequestSchema>
export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>
export type ResumeHostRoomRequest = z.infer<typeof resumeHostRoomRequestSchema>
export type ResumePlayerRoomRequest = z.infer<
	typeof resumePlayerRoomRequestSchema
>
export type ReturnToLobbyRequest = z.infer<typeof returnToLobbyRequestSchema>
export type StartGameRequest = z.infer<typeof startGameRequestSchema>
export type SubmitAnswerRequest = z.infer<typeof submitAnswerRequestSchema>
