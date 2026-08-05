import type { GameParticipantView } from '@maptap/game-domain/multiplayer/game'
import type { VisibleMemberInfo } from '@maptap/game-domain/multiplayer/room'
import { CountryMapGameScreen } from './country-map/CountryMapGameScreen'
import { getCurrentRound } from '../model/gameSelectors'
import { AnimatePresence } from 'motion/react'
import { FloatingNotice } from '../../shared/ui/FloatingNotice'

interface ActiveGameParticipantScreenProps {
	game: GameParticipantView
	members: VisibleMemberInfo[]
	submitPending: boolean
	actionErrorMessage: string | null
	isReconnecting: boolean
	onSubmitAnswer: (countryId: string) => Promise<void>
}

export function ActiveGameParticipantScreen({
	game,
	members,
	submitPending,
	actionErrorMessage,
	isReconnecting,
	onSubmitAnswer,
}: ActiveGameParticipantScreenProps): JSX.Element {
	const currentRound = getCurrentRound(game)
	if (game.phase === 'completed' || !currentRound) {
		return (
			<main className='grid h-full place-items-center bg-slate-950 px-5 py-8 text-white'>
				<p className='text-sm font-semibold text-slate-300'>
					Завершаем игру...
				</p>
			</main>
		)
	}

	// Add a game.kind switch here when the domain exposes multiple variants.
	return (
		<>
			<AnimatePresence mode='wait'>
				{isReconnecting ? (
					<FloatingNotice>Переподключаемся к комнате...</FloatingNotice>
				) : null}
			</AnimatePresence>

			<AnimatePresence mode='wait'>
				{actionErrorMessage ? (
					<FloatingNotice
						tone='error'
						offsetTop={isReconnecting ? '8.5rem' : '5.25rem'}
					>
						{actionErrorMessage}
					</FloatingNotice>
				) : null}
			</AnimatePresence>

			<CountryMapGameScreen
				game={game}
				currentRound={currentRound}
				members={members}
				submitPending={submitPending}
				onSubmitAnswer={onSubmitAnswer}
			/>
		</>
	)
}
