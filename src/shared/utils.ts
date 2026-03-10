export function toErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return `Ошибка: ${error.message}`
	}

	return 'Непредвиденная ошибка при загрузке карты или данных о странах.'
}
