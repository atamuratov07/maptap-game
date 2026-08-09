const CYRILLIC_TO_LATIN_DIGRAPHS = new Map([
	['Е', 'Ye'],
	['Ё', 'Yo'],
	['Ж', 'J'],
	['Х', 'X'],
	['Ц', 'S'],
	['Ч', 'Ch'],
	['Ш', 'Sh'],
	['Щ', 'Shch'],
	['Ю', 'Yu'],
	['Я', 'Ya'],
	['Ў', "O'"],
	['Ғ', "G'"],
	['Қ', 'Q'],
	['Ҳ', 'H'],
	['е', 'ye'],
	['ё', 'yo'],
	['ж', 'j'],
	['х', 'x'],
	['ц', 's'],
	['ч', 'ch'],
	['ш', 'sh'],
	['щ', 'shch'],
	['ю', 'yu'],
	['я', 'ya'],
	['ў', "o'"],
	['ғ', "g'"],
	['қ', 'q'],
	['ҳ', 'h'],
])

const CYRILLIC_TO_LATIN_SINGLE = new Map([
	['А', 'A'],
	['Б', 'B'],
	['В', 'V'],
	['Г', 'G'],
	['Д', 'D'],
	['З', 'Z'],
	['И', 'I'],
	['Й', 'Y'],
	['К', 'K'],
	['Л', 'L'],
	['М', 'M'],
	['Н', 'N'],
	['О', 'O'],
	['П', 'P'],
	['Р', 'R'],
	['С', 'S'],
	['Т', 'T'],
	['У', 'U'],
	['Ф', 'F'],
	['Ы', 'I'],
	['Э', 'E'],
	['Ь', ''],
	['Ъ', ''],
	['а', 'a'],
	['б', 'b'],
	['в', 'v'],
	['г', 'g'],
	['д', 'd'],
	['з', 'z'],
	['и', 'i'],
	['й', 'y'],
	['к', 'k'],
	['л', 'l'],
	['м', 'm'],
	['н', 'n'],
	['о', 'o'],
	['п', 'p'],
	['р', 'r'],
	['с', 's'],
	['т', 't'],
	['у', 'u'],
	['ф', 'f'],
	['ы', 'i'],
	['э', 'e'],
	['ь', ''],
	['ъ', ''],
])

export function normalizeUzLatnLabel(value) {
	return String(value ?? '')
		.trim()
		.replaceAll('ʻ', "'")
		.replaceAll('ʼ', "'")
		.replaceAll('‘', "'")
		.replaceAll('’', "'")
		.replaceAll('`', "'")
}

export function transliterateCyrillicToUzLatn(value) {
	const text = normalizeUzLatnLabel(value)
	let output = ''

	for (const char of text) {
		output +=
			CYRILLIC_TO_LATIN_DIGRAPHS.get(char) ??
			CYRILLIC_TO_LATIN_SINGLE.get(char) ??
			char
	}

	return output
}

export function firstUzLatnLabel(...values) {
	for (const value of values) {
		const normalized = normalizeUzLatnLabel(value)
		if (normalized) {
			return normalized
		}
	}

	return ''
}
