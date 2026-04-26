import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ButtonLink, ScreenShell } from '../../shared/ui'
import { formatGatewayErrorMessage } from '../api/errors'
import { createSocketGateway } from '../api/socketGateway'
import {
	CreateRoomForm,
	type CreateRoomFormValues,
} from '../create/CreateRoomForm'
import { JoinRoomForm } from '../join/JoinRoomForm'
import { saveRoomSession } from '../session/sessionStorage'
import type { RoomSession } from '../session/types'

export function HomePage(): JSX.Element {
	const navigate = useNavigate()
	const gateway = useMemo(() => createSocketGateway(), [])
	const [createError, setCreateError] = useState<string | null>(null)
	const [isCreating, setIsCreating] = useState(false)

	useEffect(() => {
		return () => {
			gateway.disconnect()
		}
	}, [gateway])

	const handleCreateRoom = useCallback(
		async (values: CreateRoomFormValues) => {
			setIsCreating(true)
			setCreateError(null)

			try {
				const response = await gateway.createRoom({
					hostName: values.hostName,
				})

				const storedSession: RoomSession = {
					role: response.role,
					roomId: response.roomId,
					roomCode: response.roomCode,
					memberId: response.memberId,
					memberSessionToken: response.memberSessionToken,
					savedAt: Date.now(),
				}

				saveRoomSession(storedSession)
				navigate(`/multiplayer/host/${response.roomCode}`)
			} catch (error) {
				setCreateError(formatGatewayErrorMessage(error))
			} finally {
				setIsCreating(false)
			}
		},
		[gateway, navigate],
	)

	return (
		<ScreenShell className='sm:px-8'>
			<div className='mx-auto max-w-6xl'>
				<div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
					<ButtonLink to='/' variant='nav' size='pill'>
						<span aria-hidden='true'>&larr;</span>К режимам
					</ButtonLink>
				</div>

				<div className='grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] [&>*:first-child]:order-1 [&>*:last-child]:order-2 lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1'>
					<JoinRoomForm className='lg:order-1' />
					<CreateRoomForm
						onSubmit={handleCreateRoom}
						pending={isCreating}
						submitError={createError}
						className='lg:order-2'
					/>
				</div>
			</div>
		</ScreenShell>
	)
}
