import {
	toHostRoomView,
	toPlayerRoomView,
	type PlayerId,
	type RoomId,
} from '@maptap/game-domain/multiplayer'
import type { RoomClosedEvent } from '@maptap/game-protocol'

import type { RoomsRepository } from './repository.js'
import type { GameNamespace } from './types.js'

export interface PublishRoomOptions {
	excludePlayerId?: PlayerId
}

interface RoomPublisherOptions {
	namespace: GameNamespace
	repository: RoomsRepository
}

export function createRoomPublisher({
	namespace,
	repository,
}: RoomPublisherOptions) {
	function publishRoomSnapshots(
		roomId: RoomId,
		options: PublishRoomOptions = {},
	): void {
		const context = repository.getRoomById(roomId)
		if (!context) {
			return
		}

		for (const session of repository.listPlayerSessions(roomId)) {
			if (
				!session.socketId ||
				session.playerId === options.excludePlayerId
			) {
				continue
			}

			if (session.role === 'host') {
				const snapshot = toHostRoomView(context.state, session.playerId)
				if (!snapshot) {
					continue
				}

				namespace.to(session.socketId).emit('room:host-snapshot', {
					roomId,
					snapshot,
				})
			}
			if (session.role === 'player') {
				const snapshot = toPlayerRoomView(context.state, session.playerId)
				if (!snapshot) {
					continue
				}

				namespace.to(session.socketId).emit('room:player-snapshot', {
					roomId,
					snapshot,
				})
			}
		}
	}

	function publishRoomClosed(
		roomId: RoomId,
		reason: RoomClosedEvent['reason'],
	): void {
		for (const session of repository.listPlayerSessions(roomId)) {
			if (!session.socketId) {
				continue
			}

			namespace.to(session.socketId).emit('room:closed', {
				roomId,
				reason,
			})
		}
	}

	return {
		publishRoomSnapshots,
		publishRoomClosed,
	}
}
