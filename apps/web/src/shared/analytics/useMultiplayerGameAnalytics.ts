import { useEffect, useRef } from 'react'
import type {
	RoomHostView,
	RoomPlayerView,
} from '@georally/game-domain/multiplayer'
import type {
	GameHostView,
	GameParticipantView,
} from '@georally/game-domain/multiplayer/game'
import {
	trackMultiplayerGameEnd,
	trackGameEntered,
	trackMultiplayerQuestionAnswered,
} from './track'

type AnalyzableRoomView = RoomPlayerView | RoomHostView

function isParticipantGame(
	activeGame: GameParticipantView | GameHostView,
): activeGame is GameParticipantView {
	return 'viewerScore' in activeGame
}

export function useMultiplayerGameAnalytics(
	room: AnalyzableRoomView | null,
): void {
	const enteredGameIdRef = useRef<string | null>(null)
	const lastQuestionTrackedRef = useRef<number | null>(null)
	const endedGameIdRef = useRef<string | null>(null)

	useEffect(() => {
		if (!room || room.phase !== 'active' || !room.activeGame) {
			return
		}

		const activeGame = room.activeGame
		const roomMode = room.roomMode
		const role = room.viewerRole === 'host' ? 'host' : 'player'

		if (enteredGameIdRef.current !== activeGame.gameId) {
			enteredGameIdRef.current = activeGame.gameId
			lastQuestionTrackedRef.current = null
			trackGameEntered({
				roomMode,
				role,
				questionCount: activeGame.questionCount,
				scope: activeGame.scope,
				participantCount: activeGame.participantCount,
			})
		}

		if (
			isParticipantGame(activeGame) &&
			(activeGame.phase === 'revealed' ||
				activeGame.phase === 'leaderboard') &&
			activeGame.viewerSubmission &&
			'isCorrect' in activeGame.viewerSubmission &&
			lastQuestionTrackedRef.current !== activeGame.currentQuestionNumber
		) {
			lastQuestionTrackedRef.current = activeGame.currentQuestionNumber
			trackMultiplayerQuestionAnswered({
				roomMode,
				role,
				questionNumber: activeGame.currentQuestionNumber,
				isCorrect: activeGame.viewerSubmission.isCorrect,
				responseTimeMs:
					activeGame.viewerSubmission.submittedAt != null
						? activeGame.viewerSubmission.submittedAt -
							activeGame.startedAt
						: undefined,
			})
		}

		if (
			activeGame.phase === 'completed' &&
			endedGameIdRef.current !== activeGame.gameId
		) {
			endedGameIdRef.current = activeGame.gameId
			const { result } = activeGame
			const durationMs =
				result.rounds.length > 0
					? result.finishedAt - result.rounds[0].startedAt
					: undefined

			if (isParticipantGame(activeGame)) {
				const viewerId = activeGame.viewerParticipantId
				const questionsAnswered = result.rounds.filter(
					round => round.submissions[viewerId]?.submittedAt != null,
				).length

				trackMultiplayerGameEnd({
					roomMode,
					role,
					roundsPlayed: result.rounds.length,
					durationMs,
					participantCount: activeGame.participantCount,
					score: activeGame.viewerScore,
					correctCount: activeGame.viewerCorrectCount,
					rank: activeGame.viewerRank,
					questionsAnswered,
				})
			} else {
				trackMultiplayerGameEnd({
					roomMode,
					role,
					roundsPlayed: result.rounds.length,
					durationMs,
					participantCount: activeGame.participantCount,
				})
			}
		}
	}, [room])
}
