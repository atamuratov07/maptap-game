import type { RoomClosedEvent } from '@maptap/game-protocol'

import type { MemberId } from '@maptap/game-domain/multiplayer-next'
import {
	toHostRoomView,
	toPlayerRoomView,
	type RoomId,
} from '@maptap/game-domain/multiplayer-next/room'
import type { RoomsRepository } from './repository.js'
import type { GameNamespace } from './types.js'

export interface PublishRoomOptions {
	excludeMemberId?: MemberId
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

		for (const session of repository.listMemberSessions(roomId)) {
			if (
				!session.socketId ||
				session.memberId === options.excludeMemberId
			) {
				continue
			}

			if (session.role === 'host') {
				const snapshot = toHostRoomView(context.state, session.memberId)
				if (!snapshot) {
					continue
				}

				namespace.to(session.socketId).emit('room:host-snapshot', {
					roomId,
					snapshot,
				})
			}
			if (session.role === 'player') {
				const snapshot = toPlayerRoomView(context.state, session.memberId)
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
		for (const session of repository.listMemberSessions(roomId)) {
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
