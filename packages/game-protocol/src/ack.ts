import type { GameProtocolError } from './errors'

export interface EmptyAckData {}

export interface AckSuccess<T> {
	ok: true
	data: T
}

export interface AckFailure {
	ok: false
	error: GameProtocolError
}

export type Ack<T> = AckSuccess<T> | AckFailure

export type AckCallback<T> = (response: Ack<T>) => void
