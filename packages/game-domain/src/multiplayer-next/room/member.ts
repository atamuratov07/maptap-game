import type { CommandError } from '../errors'
import { err, ok, type Result } from '../../shared/result'
import type { MemberId, RoomMemberState, RoomState } from './types'

export function canUseMemberName(
	state: RoomState,
	memberName: string,
): boolean {
	const normalizedMemberName = memberName.toLocaleLowerCase()

	return !Object.values(state.membersById).some(member => {
		return member.name.toLocaleLowerCase() === normalizedMemberName
	})
}

export function requireMember(
	state: RoomState,
	memberId: MemberId,
): Result<RoomMemberState, CommandError> {
	const member = state.membersById[memberId]

	return member ? ok(member) : err({ code: 'member_not_found' })
}

export function requireHost(
	state: RoomState,
	actorId: MemberId,
): Result<RoomMemberState, CommandError> {
	const actorResult = requireMember(state, actorId)
	if (!actorResult.ok) {
		return actorResult
	}

	const actor = actorResult.value

	if (actor.id !== state.hostId) {
		return err({
			code: 'only_host_can_manage_room',
		})
	}

	return ok(actor)
}
