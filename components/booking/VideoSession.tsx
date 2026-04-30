'use client'

import * as Sentry from '@sentry/nextjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, Mic, MicOff, Video, VideoOff, Play } from 'lucide-react'
import WaitingRoomGame from './WaitingRoomGame'
import SessionCountdown from './SessionCountdown'
import { emitSessionEvent } from '@/lib/session/client-tracker'
import { AgoraSessionAdapter } from '@/lib/session/agora-adapter'
import type { SessionAdapter, SessionJoinToken, SessionRoom } from '@/lib/session/types'

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
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [hasLocalVideo, setHasLocalVideo] = useState(false)
  const [liberando, setLiberando] = useState(false)
  const [connectingFailed, setConnectingFailed] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const adapterRef = useRef<SessionAdapter | null>(null)
  const cancelledRef = useRef(false)
  const pollingRef = useRef<number | null>(null)
  const subscribedUidsRef = useRef<Set<string>>(new Set())

  const isProfessional = isProfessionalOwner || userRole === 'profissional'
  const scheduledAt = useMemo(() => new Date(scheduledAtIso), [scheduledAtIso])

  const statusLabel = useMemo(() => {
    if (error) return 'Falha ao iniciar vídeo'
    if (isLoading) return 'Conectando à sessão...'
    if (joined) return 'Você está na sessão'
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
        if (data.ready && data.canJoinWindow && !connectingFailed) {
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

  // Attach local stream to video element whenever it changes
  useEffect(() => {
    const adapter = adapterRef.current
    const videoEl = localVideoRef.current
    if (!adapter || !videoEl) return
    const stream = adapter.getLocalStream()
    if (stream && videoEl.srcObject !== stream) {
      videoEl.srcObject = stream
    }
  }, [joined, isCameraEnabled, hasLocalVideo])

  // Connect via SessionAdapter when phase becomes 'connecting'
  useEffect(() => {
    if (phase !== 'connecting') return
    cancelledRef.current = false

    async function connect() {
      setIsLoading(true)
      setError(null)

      try {
        void emitSessionEvent(bookingId, 'session_join_attempted')

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

        const adapter: SessionAdapter = new AgoraSessionAdapter()
        adapterRef.current = adapter

        // Bind lifecycle events and store unsubscribers for cleanup
        const unsubscribers: (() => void)[] = []

        unsubscribers.push(
          adapter.onEvent('userJoined', (uid) => {
            if (cancelledRef.current) return
            setRemoteUserIds(prev => (prev.includes(uid) ? prev : [...prev, uid]))
          })
        )

        unsubscribers.push(
          adapter.onEvent('userLeft', (uid) => {
            if (cancelledRef.current) return
            setRemoteUserIds(prev => prev.filter(id => id !== uid))
            setRemoteStreams(prev => {
              const next = { ...prev }
              delete next[uid]
              return next
            })
            subscribedUidsRef.current.delete(uid)
          })
        )

        unsubscribers.push(
          adapter.onEvent('trackPublished', async (uid, _kind) => {
            if (cancelledRef.current) return
            if (subscribedUidsRef.current.has(uid)) return
            subscribedUidsRef.current.add(uid)

            try {
              const stream = await adapter.subscribe(uid)
              if (cancelledRef.current) return
              setRemoteStreams(prev => ({ ...prev, [uid]: stream }))
            } catch (err) {
              Sentry.captureMessage('[VideoSession] subscribe failed for ' + uid + ': ' + (err instanceof Error ? err.message : String(err)), { level: 'warning', tags: { area: 'video-session', context: 'subscribe' } })
              subscribedUidsRef.current.delete(uid)
            }
          })
        )

        unsubscribers.push(
          adapter.onEvent('trackUnpublished', (uid, kind) => {
            if (cancelledRef.current) return
            Sentry.captureMessage('[VideoSession] track unpublished: ' + uid + ' ' + kind, { level: 'info', tags: { area: 'video-session', context: 'track-unpublished' } })
            // Keep the stream alive; the <video> will freeze on last frame.
            // Full removal happens on userLeft.
          })
        )

        unsubscribers.push(
          adapter.onEvent('connectionStateChanged', (state, reason) => {
            if (cancelledRef.current) return
            Sentry.captureMessage('[VideoSession] connection state: ' + state + (reason ? ' (' + reason + ')' : ''), { level: 'warning', tags: { area: 'video-session', context: 'connection-state' } })
          })
        )

        unsubscribers.push(
          adapter.onEvent('error', (err) => {
            if (cancelledRef.current) return
            Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
              tags: { area: 'video_session', context: 'adapter-error' },
            })
          })
        )

        // Store unsubscribers on the adapter instance for cleanup
        ;(adapter as any).__unsubscribers = unsubscribers

        const room: SessionRoom = {
          bookingId,
          provider: 'agora',
          roomReference: tokenJson.channelName,
          status: 'join_open',
        }

        const token: SessionJoinToken = {
          token: tokenJson.token,
          roomReference: tokenJson.channelName,
          uid: tokenJson.uid,
          expiresAtUtc: tokenJson.expiresAtUtc,
          windowStartUtc: tokenJson.windowStartUtc,
          windowEndUtc: tokenJson.windowEndUtc,
          providerMeta: { appId: tokenJson.appId },
        }

        await adapter.join(room, token)

        if (!cancelledRef.current) {
          setHasLocalVideo(adapter.isVideoEnabled() && (adapter.getLocalStream()?.getVideoTracks().length ?? 0) > 0)
          setJoined(true)
          setConnectingFailed(false)
          setPhase('in-session')
          void emitSessionEvent(bookingId, 'session_joined')
          void emitSessionEvent(bookingId, 'session_started')
        }
      } catch (bootError) {
        const classified = classifyVideoError(bootError)
        if (!cancelledRef.current) {
          setConnectingFailed(true)
          setError(classified)
          void emitSessionEvent(bookingId, 'session_failed', {
            reason: classified.kind,
            message: classified.message,
          })
        }
      } finally {
        if (!cancelledRef.current) {
          setIsLoading(false)
        }
      }
    }

    void connect()
  }, [phase, bookingId])

  // Cleanup adapter on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true
      const adapter = adapterRef.current
      if (adapter) {
        const unsubscribers = (adapter as any).__unsubscribers as (() => void)[] | undefined
        unsubscribers?.forEach(u => { try { u() } catch { /* ignore */ } })
        adapter.leave().catch(() => {
          // ignore cleanup errors
        })
        adapterRef.current = null
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
    const adapter = adapterRef.current
    if (!adapter) return
    const next = !isMicEnabled
    try {
      await adapter.setAudioEnabled(next)
      setIsMicEnabled(next)
    } catch {
      // ignore toggle errors
    }
  }

  async function toggleCamera() {
    const adapter = adapterRef.current
    if (!adapter) return
    const next = !isCameraEnabled
    try {
      await adapter.setVideoEnabled(next)
      setIsCameraEnabled(next)
      setHasLocalVideo(next && (adapter.getLocalStream()?.getVideoTracks().length ?? 0) > 0)
    } catch {
      // ignore toggle errors
    }
  }

  async function handleEndSession() {
    cancelledRef.current = true
    const adapter = adapterRef.current
    if (adapter) {
      const unsubscribers = (adapter as any).__unsubscribers as (() => void)[] | undefined
      unsubscribers?.forEach(u => { try { u() } catch { /* ignore */ } })
      try { await adapter.leave() } catch { /* ignore */ }
      adapterRef.current = null
    }
    setJoined(false)
    setPhase('waiting')
    setConnectingFailed(false)
    setError(null)
    setRemoteUserIds([])
    setRemoteStreams({})
    subscribedUidsRef.current.clear()
    void emitSessionEvent(bookingId, 'session_ended')
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
              Você é o profissional desta sessão. Clique abaixo para liberar a entrada do cliente e conectar.
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
            <WaitingRoomGame isPaused={phase !== 'waiting'} />
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
          <p className="mb-2 px-1 text-xs font-medium text-slate-300">Você</p>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-56 w-full overflow-hidden rounded-md bg-black object-cover sm:h-72"
          />
          {!hasLocalVideo && joined && (
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
                  <video
                    ref={element => {
                      if (element) {
                        const stream = remoteStreams[uid]
                        if (stream && element.srcObject !== stream) {
                          element.srcObject = stream
                        }
                      }
                    }}
                    autoPlay
                    playsInline
                    className="h-44 w-full overflow-hidden rounded-lg bg-black object-cover"
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
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {isMicEnabled ? 'Microfone ligado' : 'Microfone desligado'}
        </button>
        <button
          type="button"
          onClick={toggleCamera}
          disabled={!joined}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          {isCameraEnabled ? 'Camera ligada' : 'Camera desligada'}
        </button>
        <button
          type="button"
          onClick={handleEndSession}
          className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          Encerrar sessao
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
