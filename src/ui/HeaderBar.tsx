interface HeaderBarProps {
	progressLabel: string
	targetName: string
	targetFlagUrl?: string
	elapsedSeconds: number
	canGiveUp: boolean
	onGiveUp: () => void
}

export function HeaderBar({
	progressLabel,
	targetName,
	targetFlagUrl,
	elapsedSeconds,
	canGiveUp,
	onGiveUp,
}: HeaderBarProps): JSX.Element {
	return (
		<header className='header-bar'>
			<div className='header-progress'>
				<p className='progress-label'>{progressLabel}</p>
			</div>

			<div className='header-center'>
				<div className='find-row'>
					<span className='find-label'>Найдите:</span>
					<span className='find-country'>{targetName}</span>
					{targetFlagUrl ? (
						<img src={targetFlagUrl} alt='' className='flag-chip' />
					) : null}
				</div>
			</div>

			<div className='header-actions'>
				<div className='timer-pill'>Время: {elapsedSeconds}с</div>
				<button
					type='button'
					className='ghost-button'
					onClick={onGiveUp}
					disabled={!canGiveUp}
				>
					Сдаться / Пропустить
				</button>
			</div>
		</header>
	)
}
