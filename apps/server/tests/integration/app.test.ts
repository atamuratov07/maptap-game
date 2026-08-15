import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { Server as HttpServer } from 'http'
import { bootstrapServer, type RoomClientSocket } from '../setup'
import { DEFAULT_GAME_CONFIG } from '@georally/game-domain/multiplayer'
import type {
	HostRoomSnapshotEvent,
	PlayerRoomSnapshotEvent,
	RoomClosedEvent,
} from '@georally/game-protocol'

describe('multiplayer server integration', () => {
	let httpServer: HttpServer,
		connectClient: () => Promise<RoomClientSocket>,
		resetBetweenTests: () => void,
		teardown: () => Promise<void>

	beforeAll(async () => {
		const server = await bootstrapServer()

		httpServer = server.httpServer
		resetBetweenTests = server.resetBetweenTests
		connectClient = server.connectClient
		teardown = server.teardown
	})

	afterEach(() => {
		resetBetweenTests()
	})

	afterAll(async () => {
		await teardown()
	})

	describe('GET /health', () => {
		it('reports zero room and sessions when empty', async () => {
			const response = await request(httpServer).get('/health').expect(200)

			expect(response.body).toMatchObject({
				roomCount: 0,
				connectedSessionCount: 0,
			})
		})

		it('reflects rooms and sessions after they were created', async () => {
			const hostSocket = await connectClient()
			const playerSocket = await connectClient()

			const created = await hostSocket.emitWithAck('room:create', {
				roomMode: 'classroom',
				hostName: 'Alice',
			})

			if (!created.ok) throw new Error('setup failed')

			const joined = await playerSocket.emitWithAck('room:join', {
				roomCode: created.data.roomCode,
				memberName: 'Bob',
			})
			if (!joined.ok) throw new Error('setup failed')

			const response = await request(httpServer).get('/health').expect(200)

			expect(response.body).toMatchObject({
				roomCount: 1,
				connectedSessionCount: 2,
			})
		})
	})

	describe('authentication guard', () => {
		it('rejects game actions from a socket that never created or joined a room', async () => {
			const strangerSocket = await connectClient()

			const response = await strangerSocket.emitWithAck(
				'game:submit-answer',
				{ countryId: '840' },
			)

			expect(response.ok).toBe(false)
			if (response.ok) return

			expect(response.error).toMatchObject({ code: 'unauthorized' })
		})

		it('rejects create actions from a scoket that is already authenticatd', async () => {
			const hostSocket = await connectClient()

			const createdOne = await hostSocket.emitWithAck('room:create', {
				hostName: 'Alice',
				roomMode: 'group',
			})
			if (!createdOne.ok) throw new Error('setup failed')

			const createdTwo = await hostSocket.emitWithAck('room:create', {
				hostName: 'Steve',
				roomMode: 'classroom',
			})

			expect(createdTwo.ok).toBe(false)
			if (createdTwo.ok) return
			expect(createdTwo.error.code).toBe('unauthorized')
		})
	})

	describe('event broadcast', () => {
		it("notifies the host's socket when a player joins", async () => {
			const hostSocket = await connectClient()
			const playerSocket = await connectClient()

			const created = await hostSocket.emitWithAck('room:create', {
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			if (!created.ok) throw new Error('setup failed')

			const hostSnapshotPromise = new Promise<HostRoomSnapshotEvent>(
				resolve => {
					hostSocket.once('room:host-snapshot', resolve)
				},
			)

			const joined = await playerSocket.emitWithAck('room:join', {
				roomCode: created.data.roomCode,
				memberName: 'Bob',
			})
			if (!joined.ok) throw new Error('setup failed')

			const hostSnapshotEvent = await hostSnapshotPromise
			const memberNames = hostSnapshotEvent.snapshot.members.map(
				member => member.name,
			)
			expect(memberNames).toEqual(['Alice', 'Bob'])
		})

		it("notifies the player's socket when the host terminates", async () => {
			const hostSocket = await connectClient()
			const playerSocket = await connectClient()

			const created = await hostSocket.emitWithAck('room:create', {
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			if (!created.ok) throw new Error('setup failed')

			const joined = await playerSocket.emitWithAck('room:join', {
				roomCode: created.data.roomCode,
				memberName: 'Bob',
			})
			if (!joined.ok) throw new Error('setup failed')

			const playerClosedPromise = new Promise<RoomClosedEvent>(resolve => {
				playerSocket.once('room:closed', resolve)
			})

			const closed = await hostSocket.emitWithAck('room:terminate', {})
			if (!closed.ok) throw new Error('setup failed')

			const playerClosedEvent = await playerClosedPromise

			expect(playerClosedEvent.reason).toBe('host_terminated')
		})
	})

	describe('reconnection flow', () => {
		it('notifies all connected players when the host disconnects', async () => {
			const hostSocket = await connectClient()
			const playerSocket = await connectClient()

			const created = await hostSocket.emitWithAck('room:create', {
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			if (!created.ok) throw new Error('setup failed')

			const joined = await playerSocket.emitWithAck('room:join', {
				roomCode: created.data.roomCode,
				memberName: 'Bob',
			})
			if (!joined.ok) throw new Error('setup failed')

			expect(joined.data.snapshot.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: created.data.memberId,
						connected: true,
					}),
				]),
			)

			const playerSnapshotPromise = new Promise<PlayerRoomSnapshotEvent>(
				resolve => {
					playerSocket.once('room:player-snapshot', resolve)
				},
			)

			hostSocket.disconnect()

			const playerSnapshotEvent = await playerSnapshotPromise

			expect(playerSnapshotEvent.snapshot.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: created.data.memberId,
						connected: false,
					}),
				]),
			)
		})

		it('notifies all connected players when the host reconnects', async () => {
			const hostSocket = await connectClient()
			const playerSocket = await connectClient()

			const created = await hostSocket.emitWithAck('room:create', {
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			if (!created.ok) throw new Error('setup failed')

			const joined = await playerSocket.emitWithAck('room:join', {
				roomCode: created.data.roomCode,
				memberName: 'Bob',
			})
			if (!joined.ok) throw new Error('setup failed')

			const playerSnapshotOnDisconnectPromise =
				new Promise<PlayerRoomSnapshotEvent>(resolve => {
					playerSocket.once('room:player-snapshot', resolve)
				})

			hostSocket.close()

			const playerSnapshotOnDisconnectEvent =
				await playerSnapshotOnDisconnectPromise

			const hostMember =
				playerSnapshotOnDisconnectEvent.snapshot.members.find(
					member => member.memberId === created.data.memberId,
				)
			if (hostMember?.connected) throw new Error('setup failed')

			const playerSnapshotOnResumePromise =
				new Promise<PlayerRoomSnapshotEvent>(resolve => {
					playerSocket.once('room:player-snapshot', resolve)
				})

			const newHostSocket = await connectClient()
			const resumed = await newHostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.data.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')

			const playerSnapshotOnResumeEvent = await playerSnapshotOnResumePromise

			expect(playerSnapshotOnResumeEvent.snapshot.members).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						memberId: resumed.data.memberId,
						connected: true,
					}),
				]),
			)
		})

		it('evicts the socket when another socket resumes the same sessions', async () => {
			const hostSocket = await connectClient()

			const created = await hostSocket.emitWithAck('room:create', {
				hostName: 'Alice',
				roomMode: 'classroom',
			})
			if (!created.ok) throw new Error('setup failed')

			const hostDisconnectPromise = new Promise<string>(resolve => {
				hostSocket.once('disconnect', resolve)
			})

			const newHostSocket = await connectClient()

			const resumed = await newHostSocket.emitWithAck('room:host-resume', {
				memberSessionToken: created.data.memberSessionToken,
			})
			if (!resumed.ok) throw new Error('setup failed')

			const hostDisconnectReason = await hostDisconnectPromise

			expect(hostDisconnectReason).toBe('io server disconnect')
		})
	})

	describe('per-role visibility split', () => {
		it('reaches the right socket', async () => {
			const hostSocket = await connectClient()
			const playerSocket = await connectClient()

			const created = await hostSocket.emitWithAck('room:create', {
				roomMode: 'classroom',
				hostName: 'Alice',
			})

			if (!created.ok) throw new Error('setup failed')

			const joined = await playerSocket.emitWithAck('room:join', {
				roomCode: created.data.roomCode,
				memberName: 'Bob',
			})
			if (!joined.ok) throw new Error('setup failed')

			const started = await hostSocket.emitWithAck('game:start', {
				gameConfig: DEFAULT_GAME_CONFIG,
			})
			if (!started.ok) throw new Error('setup failed')

			const playerSnapshotStartedPromise =
				new Promise<PlayerRoomSnapshotEvent>(resolve => {
					playerSocket.once('room:player-snapshot', resolve)
				})

			// why this catches snapshot if start was already made bafore and why host doesn't?
			const playerSnapshotStartedEvent = await playerSnapshotStartedPromise

			const hostSnapshotPromise = new Promise<HostRoomSnapshotEvent>(
				resolve => {
					hostSocket.once('room:host-snapshot', resolve)
				},
			)

			const playerSnapshotPromise = new Promise<PlayerRoomSnapshotEvent>(
				resolve => {
					playerSocket.once('room:player-snapshot', resolve)
				},
			)

			const revealed = await hostSocket.emitWithAck('game:reveal-round', {})
			if (!revealed.ok) throw new Error('setup failed')

			const hostSnapshotEvent = await hostSnapshotPromise

			expect(hostSnapshotEvent.snapshot.viewerRole).toBe('host')

			expect(hostSnapshotEvent.snapshot.roomMode).toBe('classroom')
			if (hostSnapshotEvent.snapshot.roomMode !== 'classroom') return

			expect(hostSnapshotEvent.snapshot.phase).toBe('active')
			if (hostSnapshotEvent.snapshot.phase !== 'active') return

			expect(hostSnapshotEvent.snapshot.activeGame.phase).toBe('revealed')
			if (hostSnapshotEvent.snapshot.activeGame.phase !== 'revealed') return

			expect(hostSnapshotEvent.snapshot.activeGame.participants).toEqual(
				expect.arrayContaining([
					{
						participantId: joined.data.memberId,
						rank: 1,
						score: 0,
						correctCount: 0,
						submission: {
							countryId: null,
							isCorrect: false,
							scoreAwarded: 0,
							submittedAt: null,
						},
					},
				]),
			)

			const playerSnapshotEvent = await playerSnapshotPromise

			expect(playerSnapshotEvent.snapshot.viewerRole).toBe('player')

			expect(playerSnapshotEvent.snapshot.roomMode).toBe('classroom')
			if (playerSnapshotEvent.snapshot.roomMode !== 'classroom') return

			expect(playerSnapshotEvent.snapshot.phase).toBe('active')
			if (playerSnapshotEvent.snapshot.phase !== 'active') return

			expect(playerSnapshotEvent.snapshot.activeGame.phase).toBe('revealed')
			if (playerSnapshotEvent.snapshot.activeGame.phase !== 'revealed')
				return

			expect(playerSnapshotEvent.snapshot.activeGame).not.toHaveProperty(
				'participants',
			)
			expect(
				playerSnapshotEvent.snapshot.activeGame.viewerSubmission,
			).toMatchObject({
				countryId: null,
				isCorrect: false,
				scoreAwarded: 0,
				submittedAt: null,
			})
		})
	})
})
