import type { RoomProtocolError } from '@maptap/game-protocol'
import { i18n } from '../../shared/i18n/setup'

export type GatewayError =
	| RoomProtocolError
	| {
			code: 'transport_error'
			message: string
	  }

export function toGatewayError(error: unknown): GatewayError {
	if (
		error &&
		typeof error === 'object' &&
		'code' in error &&
		typeof error.code === 'string'
	) {
		return error as GatewayError
	}

	if (error instanceof Error) {
		return {
			code: 'transport_error',
			message: error.message,
		}
	}

	return {
		code: 'transport_error',
		message: i18n.t('gatewayErrors.unknown'),
	}
}

export function formatGatewayErrorMessage(error: unknown): string {
	const gatewayError = toGatewayError(error)

	switch (gatewayError.code) {
		case 'room_not_found':
		case 'member_session_not_found':
		case 'unauthorized':
		case 'room_closed':
		case 'invalid_payload':
		case 'internal_error':
		case 'room_not_in_classroom_mode':
		case 'room_not_joinable':
		case 'room_participant_capacity_limit_exceeded':
		case 'only_host_can_manage_room':
		case 'insufficient_permissions':
		case 'room_not_in_lobby':
		case 'room_not_active':
		case 'room_not_finished':
		case 'active_game_not_completed':
		case 'game_not_open':
		case 'game_not_revealed':
		case 'game_not_advanceable':
		case 'game_not_ready_to_complete':
		case 'game_already_completed':
		case 'game_has_no_participants':
		case 'duplicate_game_participant':
		case 'game_participant_not_found':
		case 'game_participant_not_in_room':
		case 'country_not_eligible':
		case 'member_not_found':
		case 'member_name_required':
		case 'member_name_taken':
		case 'member_already_joined':
		case 'member_already_connected':
		case 'participant_already_submitted':
		case 'invalid_game_config':
		case 'no_eligible_countries':
		case 'insufficient_eligible_countries':
		case 'transport_error':
			return i18n.t(`gatewayErrors.${gatewayError.code}`)
	}

	return i18n.t('gatewayErrors.unknown')
}
