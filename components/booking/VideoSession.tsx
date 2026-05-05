'use client'

import { useVideoSession } from './video-session/use-video-session'
import { WaitingRoom } from './video-session/WaitingRoom'
import { ConnectingScreen } from './video-session/ConnectingScreen'
import { InSessionView } from './video-session/InSessionView'

type VideoSessionProps = {
  bookingId: string
  userRole: 'usuario' | 'profissional' | 'admin'
  isProfessionalOwner: boolean
  professionalName: string
  scheduledAtIso: string
}

export default function VideoSession({
  bookingId,
  userRole,
  isProfessionalOwner,
  professionalName,
  scheduledAtIso,
}: VideoSessionProps) {
  const {
    phase,
    isLoading,
    error,
    statusError,
    joined,
    tokenPayload,
    isMicEnabled,
    isCameraEnabled,
    remoteUserIds,
    remoteStreams,
    hasLocalVideo,
    liberando,
    localVideoRef,
    isProfessional,
    scheduledAt,
    statusLabel,
    setPhase,
    setError,
    setConnectingFailed,
    liberarSessao,
    toggleMic,
    toggleCamera,
    handleEndSession,
  } = useVideoSession({ bookingId, userRole, isProfessionalOwner, scheduledAtIso })

  if (phase === 'waiting') {
    return (
      <WaitingRoom
        scheduledAt={scheduledAt}
        statusError={statusError}
        isProfessional={isProfessional}
        professionalName={professionalName}
        liberando={liberando}
        onLiberar={liberarSessao}
      />
    )
  }

  if (phase === 'connecting') {
    return (
      <ConnectingScreen
        error={error}
        onRetry={() => {
          setError(null)
          setConnectingFailed(false)
          setPhase('waiting')
        }}
      />
    )
  }

  return (
    <InSessionView
      statusLabel={statusLabel}
      tokenPayload={tokenPayload}
      localVideoRef={localVideoRef}
      hasLocalVideo={hasLocalVideo}
      joined={joined}
      isLoading={isLoading}
      isMicEnabled={isMicEnabled}
      isCameraEnabled={isCameraEnabled}
      remoteUserIds={remoteUserIds}
      remoteStreams={remoteStreams}
      onToggleMic={toggleMic}
      onToggleCamera={toggleCamera}
      onEndSession={handleEndSession}
    />
  )
}
