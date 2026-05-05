'use client'

import { useRef, useEffect } from 'react'
import { Loader2, Mic, MicOff, Video, VideoOff } from 'lucide-react'
import type { SessionTokenPayload } from './types'

interface InSessionViewProps {
  statusLabel: string
  tokenPayload: SessionTokenPayload | null
  localVideoRef: React.RefObject<HTMLVideoElement | null>
  hasLocalVideo: boolean
  joined: boolean
  isLoading: boolean
  isMicEnabled: boolean
  isCameraEnabled: boolean
  remoteUserIds: string[]
  remoteStreams: Record<string, MediaStream>
  onToggleMic: () => void
  onToggleCamera: () => void
  onEndSession: () => void
}

export function InSessionView({
  statusLabel,
  tokenPayload,
  localVideoRef,
  hasLocalVideo,
  joined,
  isLoading,
  isMicEnabled,
  isCameraEnabled,
  remoteUserIds,
  remoteStreams,
  onToggleMic,
  onToggleCamera,
  onEndSession,
}: InSessionViewProps) {
  const remoteRefs = useRef<Record<string, HTMLVideoElement | null>>({})

  useEffect(() => {
    for (const uid of remoteUserIds) {
      const el = remoteRefs.current[uid]
      if (el) {
        const stream = remoteStreams[uid]
        if (stream && el.srcObject !== stream) {
          el.srcObject = stream
        }
      }
    }
  }, [remoteUserIds, remoteStreams])

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
                    ref={element => { remoteRefs.current[uid] = element }}
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
          onClick={onToggleMic}
          disabled={!joined}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          {isMicEnabled ? 'Microfone ligado' : 'Microfone desligado'}
        </button>
        <button
          type="button"
          onClick={onToggleCamera}
          disabled={!joined}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          {isCameraEnabled ? 'Camera ligada' : 'Camera desligada'}
        </button>
        <button
          type="button"
          onClick={onEndSession}
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
