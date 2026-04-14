import type { RoomSession } from './types'

const STORAGE_KEY = 'maptap.multiplayer.sessions'

type RoomSessionsRecord = Record<string, RoomSession>

function readStore(): RoomSessionsRecord {
	try {
		const rawValue = localStorage.getItem(STORAGE_KEY)
		if (!rawValue) {
			return {}
		}

		const parsed = JSON.parse(rawValue) as RoomSessionsRecord
		return parsed && typeof parsed === 'object' ? parsed : {}
	} catch {
		return {}
	}
}

function writeStore(store: RoomSessionsRecord): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function getSessionKey(code: string, role: RoomSession['role']) {
	return `${role}:${code.trim().toUpperCase()}`
}

export function loadRoomSession(
	roomCode: string,
	role: RoomSession['role'],
): RoomSession | null {
	const store = readStore()
	const sessionKey = getSessionKey(roomCode, role)
	return store[sessionKey] ?? null
}

export function saveRoomSession(session: RoomSession): void {
	const store = readStore()
	const sessionKey = getSessionKey(session.roomCode, session.role)
	store[sessionKey] = session
	writeStore(store)
}

export function clearRoomSession(
	roomCode: string,
	role: RoomSession['role'],
): void {
	const store = readStore()
	const sessionKey = getSessionKey(roomCode, role)
	delete store[sessionKey]
	delete store[roomCode.toUpperCase()]
	writeStore(store)
}
