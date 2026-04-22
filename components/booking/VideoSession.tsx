'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, Mic, MicOff, Video, VideoOff, Play } from 'lucide-react'
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng'
import WaitingRoomGame from './WaitingRoomGame'
import SessionCountdown from './SessionCountdown'

type VideoSessionProps = {
  bookingId: string
  userRole: 'usuario' | 'profissional' | 'admin'
  isProfessionalOwner: boolean
  professionalName: string
  scheduledAtIso: string
}

type Phase = 'waiting' | 'connecting' | 'in-session'

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
        'Permissao de camera ou microfone negada. Verifique as permissoes do navegador e tente novamente.',
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
        'Nao foi possivel acessar a camera. Verifique se ela esta conectada e nao esta sendo usada por outro aplicativo.',
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
        'Nao foi possivel acessar o microfone. Verifique se ele esta conectado e nao esta sendo usado por outro aplicativo.',
    }
  }

  if (lower.includes('token') || lower.includes('unauthorized')) {
    return {
      kind: 'token_failed',
      message: 'Falha ao obter autorizacao para a sessao de video. Tente recarregar a pagina.',
    }
  }

  if (lower.includes('join') || lower.includes('connect')) {
    return {
      kind: 'join_failed',
      message: 'Nao foi possivel conectar a sessao de video. Verifique sua conexao de internet.',
    }
  }

  return {
    kind: 'unknown',
    message: error instanceof Error ? error.message : 'Erro ao iniciar a sessao de video.',
  }
}

export default function VideoSession({
  bookingId,
  userRole,
  isProfessionalOwner,
  professionalName,
  scheduledAtIso,
}: VideoSessionProps) {
  const [phase, setPhase] = useState<Phase>('waiting')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<VideoError | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [tokenPayload, setTokenPayload] = useState<SessionTokenPayload | null>(null)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [remoteUserIds, setRemoteUserIds] = useState<string[]>([])
  const [liberando, setLiberando] = useState(false)
  const [connectingFailed, setConnectingFailed] = useState(false)

  const localVideoRef = useRef<HTMLDivElement | null>(null)
  const remoteContainerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const remoteUsersRef = useRef<Record<string, IAgoraRTCRemoteUser>>({})
  const cancelledRef = useRef(false)
  const pollingRef = useRef<number | null>(null)

  const isProfessional = isProfessionalOwner || userRole === 'profissional'
  const scheduledAt = useMemo(() => new Date(scheduledAtIso), [scheduledAtIso])

  const statusLabel = useMemo(() => {
    if (error) return 'Falha ao iniciar video'
    if (isLoading) return 'Conectando a sessao...'
    if (joined) return 'Voce esta na sessao'
    return 'Pronto para entrar'
  }, [error, isLoading, joined])

  // Poll session status while in waiting phase
  useEffect(() => {
    if (phase !== 'waiting') {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    let mounted = true

    async function checkStatus() {
      try {
        const res = await fetch(`/api/sessao/status?bookingId=${bookingId}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          if (mounted) setStatusError(data.error || 'Erro ao consultar status.')
          return
        }
        const data = await res.json()
        if (!mounted) return
        setStatusError(null)
        if (data.ready && !connectingFailed) {
          setPhase('connecting')
        }
      } catch {
        if (mounted) setStatusError('Erro de rede ao consultar status.')
      }
    }

    // Check immediately
    void checkStatus()
    pollingRef.current = window.setInterval(checkStatus, 2000)

    return () => {
      mounted = false
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [phase, bookingId, connectingFailed])

  // Connect to Agora when phase becomes 'connecting'
  useEffect(() => {
    if (phase !== 'connecting') return
    cancelledRef.current = false

    async function connect() {
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
          throw new Error(tokenJson?.error || 'Falha ao obter token da sessao.')
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
          setConnectingFailed(false)
          setPhase('in-session')
        }
      } catch (bootError) {
        const classified = classifyVideoError(bootError)
        if (!cancelledRef.current) {
          setConnectingFailed(true)
          setError(classified)
        }
      } finally {
        if (!cancelledRef.current) {
          setIsLoading(false)
        }
      }
    }

    void connect()
  }, [phase, bookingId])

  // Cleanup Agora resources on unmount only
  useEffect(() => {
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
  }, [])

  async function liberarSessao() {
    setLiberando(true)
    setStatusError(null)
    try {
      const res = await fetch('/api/sessao/liberar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatusError(data.error || 'Falha ao liberar sessao.')
        return
      }
      setPhase('connecting')
    } catch {
      setStatusError('Erro de rede ao liberar sessao.')
    } finally {
      setLiberando(false)
    }
  }

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

  // Waiting room UI
  if (phase === 'waiting') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Sala de espera</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <SessionCountdown targetDate={scheduledAt} />
            {statusError ? (
              <span className="text-xs text-red-600">{statusError}</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Sincronizando
              </span>
            )}
          </div>
        </div>

        {/* Professional controls */}
        {isProfessional && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-700">
              Voce e o profissional desta sessao. Clique abaixo para liberar a entrada do cliente e conectar.
            </p>
            <button
              type="button"
              onClick={liberarSessao}
              disabled={liberando}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#9FE870] px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-[#8dd65f] hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
            >
              {liberando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {liberando ? 'Liberando...' : 'Entrar na sessao'}
            </button>
          </div>
        )}

        {/* Client message */}
        {!isProfessional && (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-800">
              Aguardando <span className="font-bold">{professionalName}</span> entrar na sessao
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Assim que o profissional liberar, voce sera conectado automaticamente.
            </p>
          </div>
        )}

        {/* Game — client only */}
        {!isProfessional && (
          <div className="rounded-lg border border-slate-200 bg-slate-100 p-2">
            <p className="mb-2 px-1 text-xs font-medium text-slate-600">Sala de espera</p>
            <WaitingRoomGame />
          </div>
        )}
      </div>
    )
  }

  // Connecting phase — animated transition
  if (phase === 'connecting') {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#9FE870]/20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-700" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Conectando a sessao...</p>
          <p className="mt-1 text-xs text-slate-500">
            Preparando camera e microfone
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  {error.kind === 'permission_denied'
                    ? 'Permissao necessaria'
                    : error.kind === 'camera_unavailable'
                      ? 'Camera indisponivel'
                      : error.kind === 'microphone_unavailable'
                        ? 'Microfone indisponivel'
                        : 'Erro na sessao'}
                </p>
                <p className="mt-0.5">{error.message}</p>
                {error.kind === 'permission_denied' && (
                  <p className="mt-1 text-xs">
                    Dica: Clique no icone de cadeado na barra de endereco do navegador e permita acesso a camera e microfone.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setConnectingFailed(false)
                setPhase('waiting')
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              Voltar e tentar novamente
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  // In-session UI
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">{statusLabel}</p>
        {tokenPayload ? (
          <p className="mt-1 text-xs text-slate-500">
            Token expira em {new Date(tokenPayload.expiresAtUtc).toLocaleTimeString('pt-BR')}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-950 p-2">
          <p className="mb-2 px-1 text-xs font-medium text-slate-300">Voce</p>
          <div
            ref={localVideoRef}
            className="h-56 w-full overflow-hidden rounded-md bg-black sm:h-72"
          />
          {!localVideoTrackRef.current && joined && (
            <p className="mt-1 px-1 text-xs text-slate-400">Camera desativada ou indisponivel</p>
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
          {isCameraEnabled ? 'Camera ligada' : 'Camera desligada'}
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
