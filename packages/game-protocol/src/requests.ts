import { z } from 'zod'

import { GAME_DIFFICULTIES, GAME_SCOPES } from '@maptap/game-domain'
import { QUIZ_QUESTION_PACK_IDS } from '@maptap/game-domain/multiplayer-next'

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
export const terminateRoomRequestSchema = z.object({})

const questionCountSchema = z.number().int().min(1).max(50)
const questionDurationMsSchema = z.number().int().min(5_000).max(120_000)

export const countryMapGameConfigSchema = z.object({
	gameKind: z.literal('country-map').optional(),
	questionCount: questionCountSchema,
	difficulty: difficultySchema,
	scope: scopeSchema,
	questionDurationMs: questionDurationMsSchema,
})

export const quizGameConfigSchema = z.object({
	gameKind: z.literal('quiz'),
	packId: z.enum(QUIZ_QUESTION_PACK_IDS),
	questionCount: questionCountSchema,
	questionDurationMs: questionDurationMsSchema,
})

export const startGameRequestSchema = z.object({
	gameConfig: z.union([quizGameConfigSchema, countryMapGameConfigSchema]),
})

export const playerAnswerSchema = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('country_id'),
		countryId: z.string().regex(/^\d{3}$/),
	}),
	z.object({
		kind: z.literal('choice_id'),
		choiceId: z.string().trim().min(1).max(80),
	}),
])

export const submitAnswerRequestSchema = z.object({
	answer: playerAnswerSchema,
})

export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>
export type LookupRoomRequest = z.infer<typeof lookupRoomRequestSchema>
export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>
export type ResumeHostRoomRequest = z.infer<typeof resumeHostRoomRequestSchema>
export type ResumePlayerRoomRequest = z.infer<
	typeof resumePlayerRoomRequestSchema
>
export type ReturnToLobbyRequest = z.infer<typeof returnToLobbyRequestSchema>
export type TerminateRoomRequest = z.infer<typeof terminateRoomRequestSchema>
export type StartGameRequest = z.infer<typeof startGameRequestSchema>
export type SubmitAnswerRequest = z.infer<typeof submitAnswerRequestSchema>
