type ClassDictionary = Record<string, boolean | null | undefined>

export type ClassValue =
	| string
	| number
	| false
	| null
	| undefined
	| ClassDictionary
	| ClassValue[]

function appendClassValue(value: ClassValue, classes: string[]): void {
	if (!value) {
		return
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			appendClassValue(item, classes)
		}
		return
	}

	if (typeof value === 'object') {
		for (const [className, enabled] of Object.entries(value)) {
			if (enabled) {
				classes.push(className)
			}
		}
		return
	}

	classes.push(String(value))
}

export function cn(...values: ClassValue[]): string {
	const classes: string[] = []

	for (const value of values) {
		appendClassValue(value, classes)
	}

	return classes.join(' ')
}
