import type { GatewayError } from './types'

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
		message: 'Неизвестная транспортная ошибка.',
	}
}

export function formatGatewayErrorMessage(error: unknown): string {
	const gatewayError = toGatewayError(error)

	switch (gatewayError.code) {
		case 'room_not_found':
			return 'Комната не найдена.'
		case 'player_session_not_found':
			return 'Сохранённый вход истёк.'
		case 'unauthorized':
			return 'Не удалось восстановить вход.'
		case 'room_closed':
			return 'Эта комната уже закрыта.'
		case 'invalid_payload':
			return 'Сервер отклонил отправленные данные.'
		case 'internal_error':
			return 'Сервер вернул внутреннюю ошибку.'
		case 'room_not_joinable':
			return 'В эту комнату больше нельзя войти.'
		case 'only_host_can_start':
			return 'Только хост может начать игру.'
		case 'room_not_in_lobby':
			return 'Комната больше не находится в лобби.'
		case 'player_name_required':
			return 'Нужно указать имя игрока.'
		case 'player_name_taken':
			return 'Это имя игрока уже занято.'
		case 'player_already_joined':
			return 'Этот игрок уже вошёл в комнату.'
		case 'player_already_connected':
			return 'Вы уже в комнате.'
		case 'player_not_found':
			return 'Игрок не найден в этой комнате.'
		case 'player_not_connected':
			return 'Игрок не подключён к комнате.'
		case 'player_already_submitted':
			return 'Вы уже отправили ответ на этот раунд.'
		case 'room_not_in_question_open':
			return 'Комната сейчас не принимает ответы.'
		case 'room_not_in_question_revealed':
			return 'Комната сейчас не находится на этапе раскрытия.'
		case 'room_not_on_leaderboard':
			return 'Комната сейчас не находится на этапе таблицы лидеров.'
		case 'room_already_finished':
			return 'Игра уже завершена.'
		case 'no_eligible_countries':
			return 'Для этой комнаты нет подходящих стран.'
		case 'insufficient_eligible_countries':
			return 'Настройки комнаты запрашивают больше вопросов, чем доступно стран.'
		case 'transport_error':
			return 'Не удалось подключиться.'
	}

	return 'Произошла неизвестная ошибка.'
}
