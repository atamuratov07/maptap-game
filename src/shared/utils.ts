export function toErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return `Error: ${error.message}`
	}

	return 'Unexpected error while loading map or country data.'
}
