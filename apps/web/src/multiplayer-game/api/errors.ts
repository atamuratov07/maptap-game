import type { GameProtocolError } from '@maptap/game-protocol'

export type GatewayError =
	| GameProtocolError
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
		message: 'Неизвестная ошибка соединения.',
	}
}

export function formatGatewayErrorMessage(error: unknown): string {
	const gatewayError = toGatewayError(error)

	switch (gatewayError.code) {
		case 'room_not_found':
			return 'Комната не найдена.'
		case 'member_session_not_found':
			return 'Сохранённая сессия комнаты истекла.'
		case 'unauthorized':
			return 'Не удалось восстановить сессию комнаты.'
		case 'room_closed':
			return 'Эта комната закрыта.'
		case 'invalid_payload':
			return 'Сервер отклонил данные запроса.'
		case 'internal_error':
			return 'Сервер вернул внутреннюю ошибку.'
		case 'room_not_joinable':
			return 'К этой комнате сейчас нельзя присоединиться.'
		case 'only_host_can_manage_room':
			return 'Это действие доступно только хосту.'
		case 'room_not_in_lobby':
			return 'Комната уже не в лобби.'
		case 'room_not_active':
			return 'В комнате сейчас нет активной игры.'
		case 'room_not_finished':
			return 'Комната ещё не завершена.'
		case 'active_game_not_completed':
			return 'Активная игра ещё не завершена.'
		case 'game_not_open':
			return 'Игра сейчас не принимает ответы.'
		case 'game_not_revealed':
			return 'Игра сейчас не в фазе раскрытия ответа.'
		case 'game_not_on_leaderboard':
			return 'Игра сейчас не показывает таблицу лидеров.'
		case 'game_not_ready_to_complete':
			return 'Игра ещё не готова к завершению.'
		case 'game_already_completed':
			return 'Игра уже завершена.'
		case 'game_has_no_participants':
			return 'В игре нет участников.'
		case 'duplicate_game_participant':
			return 'Участник был добавлен в игру больше одного раза.'
		case 'game_participant_not_found':
			return 'Этого участника нет в игре.'
		case 'game_participant_not_in_room':
			return 'Этот участник игры не находится в комнате.'
		case 'country_not_eligible':
			return 'Эта страна недоступна в текущей игре.'
		case 'member_not_found':
			return 'Этого участника нет в комнате.'
		case 'member_name_required':
			return 'Введите имя игрока.'
		case 'member_name_taken':
			return 'Это имя игрока уже занято.'
		case 'member_already_joined':
			return 'Этот игрок уже присоединился.'
		case 'member_already_connected':
			return 'Вы уже подключены к этой комнате.'
		case 'participant_already_submitted':
			return 'Вы уже отправили ответ в этом раунде.'
		case 'no_eligible_countries':
			return 'Для этих настроек нет доступных стран.'
		case 'insufficient_eligible_countries':
			return 'В этих настройках вопросов больше, чем доступных стран.'
		case 'transport_error':
			return 'Не удалось подключиться к игровому серверу.'
	}
}
