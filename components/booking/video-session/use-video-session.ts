'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { emitSessionEvent } from '@/lib/session/client-tracker'
import { AgoraSessionAdapter } from '@/lib/session/agora-adapter'
import type { SessionAdapter, SessionJoinToken, SessionRoom } from '@/lib/session/types'
import type { Phase, SessionTokenPayload, VideoError } from './types'
import { classifyVideoError } from './types'

interface UseVideoSessionProps {
  bookingId: string
  userRole: 'usuario' | 'profissional' | 'admin'
  isProfessionalOwner: boolean
  scheduledAtIso: string
}

export function useVideoSession({
  bookingId,
  userRole,
  isProfessionalOwner,
  scheduledAtIso,
}: UseVideoSessionProps) {
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
  const unsubscribersRef = useRef<(() => void)[]>([])
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

        unsubscribersRef.current = unsubscribers

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
        unsubscribersRef.current.forEach(u => { try { u() } catch { /* ignore */ } })
        unsubscribersRef.current = []
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
      unsubscribersRef.current.forEach(u => { try { u() } catch { /* ignore */ } })
      unsubscribersRef.current = []
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

  return {
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
    connectingFailed,
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
  }
}
