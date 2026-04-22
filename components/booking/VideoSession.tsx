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

type VideoError =
  | { kind: 'permission_denied'; message: string }
  | { kind: 'camera_unavailable'; message: string }
  | { kind: 'microphone_unavailable'; message: string }
  | { kind: 'token_failed'; message: string }
  | { kind: 'join_failed'; message: string }
  | { kind: 'unknown'; message: string }

function classifyVideoError(error: unknown): VideoError {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  if (
    lower.includes('permission') ||
    lower.includes('notallowederror') ||
    lower.includes('domexception') ||
    lower.includes('access denied')
  ) {
    return {
      kind: 'permission_denied',
      message:
        'Permissão de câmera ou microfone negada. Verifique as permissões do navegador e tente novamente.',
    }
  }

  if (
    lower.includes('camera') ||
    lower.includes('videoinput') ||
    lower.includes('device not found') ||
    lower.includes('could not start video')
  ) {
    return {
      kind: 'camera_unavailable',
      message:
        'Não foi possível acessar a câmera. Verifique se ela está conectada e não está sendo usada por outro aplicativo.',
    }
  }

  if (
    lower.includes('microphone') ||
    lower.includes('audioinput') ||
    lower.includes('could not start audio')
  ) {
    return {
      kind: 'microphone_unavailable',
      message:
        'Não foi possível acessar o microfone. Verifique se ele está conectado e não está sendo usado por outro aplicativo.',
    }
  }

  if (lower.includes('token') || lower.includes('unauthorized')) {
    return {
      kind: 'token_failed',
      message: 'Falha ao obter autorização para a sessão de vídeo. Tente recarregar a página.',
    }
  }

  if (lower.includes('join') || lower.includes('connect')) {
    return {
      kind: 'join_failed',
      message: 'Não foi possível conectar à sessão de vídeo. Verifique sua conexão de internet.',
    }
  }

  return {
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'Erro ao iniciar a sessão de vídeo.',
  }
}

export default function VideoSession({ bookingId }: VideoSessionProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<VideoError | null>(null)
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
  const cancelledRef = useRef(false)

  const statusLabel = useMemo(() => {
    if (error) return 'Falha ao iniciar vídeo'
    if (isLoading) return 'Conectando à sessão...'
    if (joined) return 'Você está na sessão'
    return 'Pronto para entrar'
  }, [error, isLoading, joined])

  useEffect(() => {
    cancelledRef.current = false

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
        if (cancelledRef.current) return
        setTokenPayload(tokenJson as SessionTokenPayload)

        const agoraModule = await import('agora-rtc-sdk-ng')
        const AgoraRTC = agoraModule.default
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client

        client.on('user-published', async (user, mediaType) => {
          if (cancelledRef.current) return
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

        client.on('connection-state-change', (curState, revState, reason) => {
          if (cancelledRef.current) return
          console.warn('[agora] connection state:', revState, '->', curState, reason)
        })

        let microphoneTrack: IMicrophoneAudioTrack | undefined
        let cameraTrack: ICameraVideoTrack | undefined

        try {
          const tracks = await AgoraRTC.createMicrophoneAndCameraTracks()
          microphoneTrack = tracks[0]
          cameraTrack = tracks[1]
        } catch (trackError) {
          const classified = classifyVideoError(trackError)
          // Fallback: try audio-only if camera failed but not permission denied
          if (classified.kind === 'camera_unavailable') {
            try {
              microphoneTrack = await AgoraRTC.createMicrophoneAudioTrack()
            } catch {
              throw trackError
            }
          } else {
            throw trackError
          }
        }

        localAudioTrackRef.current = microphoneTrack || null
        localVideoTrackRef.current = cameraTrack || null

        await client.join(tokenJson.appId, tokenJson.channelName, tokenJson.token, tokenJson.uid)

        const tracksToPublish: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = []
        if (microphoneTrack) tracksToPublish.push(microphoneTrack)
        if (cameraTrack) tracksToPublish.push(cameraTrack)

        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish)
        }

        if (cameraTrack && localVideoRef.current) {
          cameraTrack.play(localVideoRef.current)
        }

        if (!cancelledRef.current) {
          setJoined(true)
        }
      } catch (bootError) {
        const classified = classifyVideoError(bootError)
        if (!cancelledRef.current) {
          setError(classified)
        }
      } finally {
        if (!cancelledRef.current) {
          setIsLoading(false)
        }
      }
    }

    void boot()

    return () => {
      cancelledRef.current = true
      const client = clientRef.current
      const localAudio = localAudioTrackRef.current
      const localVideo = localVideoTrackRef.current

      if (localAudio) {
        try {
          localAudio.stop()
          localAudio.close()
        } catch {
          // ignore cleanup errors
        }
      }
      if (localVideo) {
        try {
          localVideo.stop()
          localVideo.close()
        } catch {
          // ignore cleanup errors
        }
      }
      if (client) {
        try {
          client.removeAllListeners()
          client.leave().catch(() => {
            // ignore leave errors during cleanup
          })
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }, [bookingId])

  async function toggleMic() {
    const track = localAudioTrackRef.current
    if (!track) return
    const next = !isMicEnabled
    try {
      await track.setEnabled(next)
      setIsMicEnabled(next)
    } catch {
      // ignore toggle errors
    }
  }

  async function toggleCamera() {
    const track = localVideoTrackRef.current
    if (!track) return
    const next = !isCameraEnabled
    try {
      await track.setEnabled(next)
      setIsCameraEnabled(next)
    } catch {
      // ignore toggle errors
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">{statusLabel}</p>
        {tokenPayload ? (
          <p className="mt-1 text-xs text-slate-500">
            Token expira em {new Date(tokenPayload.expiresAtUtc).toLocaleTimeString('pt-BR')}
          </p>
        ) : null}
        {error ? (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">
                {error.kind === 'permission_denied'
                  ? 'Permissão necessária'
                  : error.kind === 'camera_unavailable'
                    ? 'Câmera indisponível'
                    : error.kind === 'microphone_unavailable'
                      ? 'Microfone indisponível'
                      : 'Erro na sessão'}
              </p>
              <p className="mt-0.5">{error.message}</p>
              {error.kind === 'permission_denied' && (
                <p className="mt-1 text-xs">
                  Dica: Clique no ícone de cadeado 🔒 na barra de endereço do navegador e permita acesso à câmera e microfone.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-950 p-2">
          <p className="mb-2 px-1 text-xs font-medium text-slate-300">Você</p>
          <div
            ref={localVideoRef}
            className="h-56 w-full overflow-hidden rounded-md bg-black sm:h-72"
          />
          {!localVideoTrackRef.current && joined && (
            <p className="mt-1 px-1 text-xs text-slate-400">Câmera desativada ou indisponível</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-100 p-2">
          <p className="mb-2 px-1 text-xs font-medium text-slate-600">Participantes</p>
          {remoteUserIds.length === 0 ? (
            <div className="flex h-56 items-center justify-center rounded-md bg-white text-sm text-slate-500 sm:h-72">
              Aguardando outro participante entrar...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {remoteUserIds.map(uid => (
                <div key={uid} className="rounded-md border border-slate-200 bg-white p-2">
                  <p className="mb-1 text-xs font-medium text-slate-600">Participante {uid}</p>
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
          disabled={!joined || !localAudioTrackRef.current}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {isMicEnabled ? 'Microfone ligado' : 'Microfone desligado'}
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          disabled={!joined || !localVideoTrackRef.current}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          {isCameraEnabled ? 'Câmera ligada' : 'Câmera desligada'}
        </button>
        {isLoading ? (
          <span className="inline-flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Inicializando...
          </span>
        ) : null}
      </div>
    </div>
  )
}
