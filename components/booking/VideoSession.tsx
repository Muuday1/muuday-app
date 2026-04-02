'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'

type VideoSessionProps = {
  bookingId: string
}

type SessionTokenPayload = {
  appId: string
  token: string
  channelName: string
  uid: string
  expiresAtUtc: string
  windowStartUtc: string
  windowEndUtc: string
}

export default function VideoSession({ bookingId }: VideoSessionProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [tokenPayload, setTokenPayload] = useState<SessionTokenPayload | null>(null)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [remoteUserIds, setRemoteUserIds] = useState<string[]>([])

  const localVideoRef = useRef<HTMLDivElement | null>(null)
  const remoteContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const remoteUsersRef = useRef<Record<string, IAgoraRTCRemoteUser>>({})

  const statusLabel = useMemo(() => {
    if (error) return 'Falha ao iniciar vídeo'
    if (isLoading) return 'Conectando à sessão...'
    if (joined) return 'Você está na sessão'
    return 'Pronto para entrar'
  }, [error, isLoading, joined])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      setIsLoading(true)
      setError(null)

      try {
        const tokenResponse = await fetch('/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        })

        const tokenJson = await tokenResponse.json()
        if (!tokenResponse.ok) {
          throw new Error(tokenJson?.error || 'Falha ao obter token da sessão.')
        }
        if (cancelled) return
        setTokenPayload(tokenJson as SessionTokenPayload)

        const agoraModule = await import('agora-rtc-sdk-ng')
        const AgoraRTC = agoraModule.default
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client

        client.on('user-published', async (user, mediaType) => {
          remoteUsersRef.current[String(user.uid)] = user
          await client.subscribe(user, mediaType)

          if (mediaType === 'audio' && user.audioTrack) {
            user.audioTrack.play()
          }

          if (mediaType === 'video') {
            const uid = String(user.uid)
            setRemoteUserIds(prev => (prev.includes(uid) ? prev : [...prev, uid]))
            setTimeout(() => {
              const container = remoteContainerRefs.current[uid]
              if (container && user.videoTrack) {
                user.videoTrack.play(container)
              }
            }, 0)
          }
        })

        client.on('user-unpublished', (user, mediaType) => {
          const uid = String(user.uid)
          if (mediaType === 'video') {
            setRemoteUserIds(prev => prev.filter(item => item !== uid))
            delete remoteUsersRef.current[uid]
          }
        })

        const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        localAudioTrackRef.current = microphoneTrack
        localVideoTrackRef.current = cameraTrack

        await client.join(tokenJson.appId, tokenJson.channelName, tokenJson.token, tokenJson.uid)
        await client.publish([microphoneTrack, cameraTrack])
        if (localVideoRef.current) {
          cameraTrack.play(localVideoRef.current)
        }
        if (!cancelled) {
          setJoined(true)
        }
      } catch (bootError) {
        const message = bootError instanceof Error ? bootError.message : 'Erro ao iniciar a sessão.'
        if (!cancelled) {
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void boot()

    return () => {
      cancelled = true
      const client = clientRef.current
      const localAudio = localAudioTrackRef.current
      const localVideo = localVideoTrackRef.current

      if (localAudio) {
        localAudio.stop()
        localAudio.close()
      }
      if (localVideo) {
        localVideo.stop()
        localVideo.close()
      }
      if (client) {
        client.removeAllListeners()
        void client.leave()
      }
    }
  }, [bookingId])

  async function toggleMic() {
    const track = localAudioTrackRef.current
    if (!track) return
    const next = !isMicEnabled
    await track.setEnabled(next)
    setIsMicEnabled(next)
  }

  async function toggleCamera() {
    const track = localVideoTrackRef.current
    if (!track) return
    const next = !isCameraEnabled
    await track.setEnabled(next)
    setIsCameraEnabled(next)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4">
        <p className="text-sm font-semibold text-neutral-900">{statusLabel}</p>
        {tokenPayload ? (
          <p className="mt-1 text-xs text-neutral-500">
            Token expira em {new Date(tokenPayload.expiresAtUtc).toLocaleTimeString('pt-BR')}
          </p>
        ) : null}
        {error ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-950 p-2">
          <p className="mb-2 px-1 text-xs font-medium text-neutral-300">Você</p>
          <div
            ref={localVideoRef}
            className="h-56 w-full overflow-hidden rounded-xl bg-black sm:h-72"
          />
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-2">
          <p className="mb-2 px-1 text-xs font-medium text-neutral-600">Participantes</p>
          {remoteUserIds.length === 0 ? (
            <div className="flex h-56 items-center justify-center rounded-xl bg-white text-sm text-neutral-500 sm:h-72">
              Aguardando outro participante entrar...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {remoteUserIds.map(uid => (
                <div key={uid} className="rounded-xl border border-neutral-200 bg-white p-2">
                  <p className="mb-1 text-xs font-medium text-neutral-600">Participante {uid}</p>
                  <div
                    ref={element => {
                      remoteContainerRefs.current[uid] = element
                      const user = remoteUsersRef.current[uid]
                      if (element && user?.videoTrack) {
                        user.videoTrack.play(element)
                      }
                    }}
                    className="h-44 w-full overflow-hidden rounded-lg bg-black"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggleMic}
          disabled={!joined}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {isMicEnabled ? 'Microfone ligado' : 'Microfone desligado'}
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          disabled={!joined}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          {isCameraEnabled ? 'Câmera ligada' : 'Câmera desligada'}
        </button>
        {isLoading ? (
          <span className="inline-flex items-center gap-2 text-xs text-neutral-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Inicializando...
          </span>
        ) : null}
      </div>
    </div>
  )
}
