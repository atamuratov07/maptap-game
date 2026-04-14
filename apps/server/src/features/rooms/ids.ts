import { randomBytes, randomInt, randomUUID } from 'node:crypto'

import type { RoomCode } from '@maptap/game-domain/multiplayer'

import type { PlayerSessionToken } from './types.js'

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ROOM_CODE_LENGTH = 6

function createRandomRoomCode(): RoomCode {
	let code = ''

	for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
		const offset = randomInt(ROOM_CODE_ALPHABET.length)
		code += ROOM_CODE_ALPHABET[offset]
	}

	return code
}

export function createRoomId(): string {
	return randomUUID()
}

export function createPlayerId(): string {
	return randomUUID()
}

export function createPlayerSessionToken(): PlayerSessionToken {
	return randomBytes(24).toString('base64url')
}

export function createRoomCode(
	isAvailable: (roomCode: RoomCode) => boolean,
): RoomCode {
	for (let attempt = 0; attempt < 64; attempt += 1) {
		const roomCode = createRandomRoomCode()
		if (isAvailable(roomCode)) {
			return roomCode
		}
	}

	throw new Error('Unable to generate a unique room code.')
}
