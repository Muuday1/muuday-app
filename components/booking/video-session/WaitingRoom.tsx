'use client'

import { Loader2, Play } from 'lucide-react'
import WaitingRoomGame from '../WaitingRoomGame'
import SessionCountdown from '../SessionCountdown'

interface WaitingRoomProps {
  scheduledAt: Date
  statusError: string | null
  isProfessional: boolean
  professionalName: string
  liberando: boolean
  onLiberar: () => void
}

export function WaitingRoom({
  scheduledAt,
  statusError,
  isProfessional,
  professionalName,
  liberando,
  onLiberar,
}: WaitingRoomProps) {
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
            onClick={onLiberar}
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
          <WaitingRoomGame isPaused={false} />
        </div>
      )}
    </div>
  )
}
