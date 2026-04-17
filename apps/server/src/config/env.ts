import { z } from 'zod'

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3001),
	HOST: z.string().min(1).default('0.0.0.0'),
	CORS_ORIGIN: z.string().default('http://localhost:5173'),
	REVEAL_DURATION_MS: z.coerce.number().int().min(1_000).default(3_000),
	LEADERBOARD_DURATION_MS: z.coerce.number().int().min(1_000).default(3_000),
})

export interface AppEnv {
	port: number
	host: string
	corsOrigins: string[]
	revealDurationMs: number
	leaderboardDurationMs: number
}

function parseCorsOrigins(value: string): string[] {
	return value
		.split(',')
		.map(origin => origin.trim())
		.filter(origin => origin.length > 0)
}

export function parseEnv(input: NodeJS.ProcessEnv): AppEnv {
	const env = envSchema.parse(input)

	return {
		port: env.PORT,
		host: env.HOST,
		corsOrigins: parseCorsOrigins(env.CORS_ORIGIN),
		revealDurationMs: env.REVEAL_DURATION_MS,
		leaderboardDurationMs: env.LEADERBOARD_DURATION_MS,
	}
}
