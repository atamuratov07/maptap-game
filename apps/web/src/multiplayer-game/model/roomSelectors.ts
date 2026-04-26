import type { RoomClosedEvent } from '@maptap/game-protocol'
import type {
	RoomView,
	VisibleMemberInfo,
} from '@maptap/game-domain/multiplayer-next/room'

export function getViewerMember(room: RoomView): VisibleMemberInfo | null {
	return (
		room.members.find(member => member.memberId === room.viewerMemberId) ??
		null
	)
}

export function getMemberName(
	members: readonly VisibleMemberInfo[],
	memberId: string,
): string {
	return members.find(member => member.memberId === memberId)?.name ?? memberId
}

export function formatClosedReason(reason: RoomClosedEvent['reason']): string {
	if (reason === 'host_terminated') {
		return 'Хост закрыл комнату.'
	}

	if (reason === 'expired') {
		return 'Время комнаты истекло.'
	}

	return 'Комната была закрыта.'
}
