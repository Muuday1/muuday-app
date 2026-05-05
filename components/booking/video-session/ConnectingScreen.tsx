'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import type { VideoError } from './types'

interface ConnectingScreenProps {
  error: VideoError | null
  onRetry: () => void
}

export function ConnectingScreen({ error, onRetry }: ConnectingScreenProps) {
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
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            Voltar e tentar novamente
          </button>
        </div>
      ) : null}
    </div>
  )
}
