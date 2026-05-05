'use client'

import { Loader2, Check, Save, AlertCircle } from 'lucide-react'
import type { SaveStatus } from '../../availability-workspace-helpers'

interface AvailabilitySaveBarProps {
  hasUnsavedChanges: boolean
  saveStatus: SaveStatus
  hasErrors: boolean
  professionalId: string | null
  errorMessage: string
  onSave: () => void
}

export function AvailabilitySaveBar({
  hasUnsavedChanges,
  saveStatus,
  hasErrors,
  professionalId,
  errorMessage,
  onSave,
}: AvailabilitySaveBarProps) {
  return (
    <div className="sticky bottom-4 z-30 -mx-2 rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:mx-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {hasUnsavedChanges ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-sm font-medium text-amber-700">Alterações não salvas</span>
            </>
          ) : saveStatus === 'success' ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Tudo salvo</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="text-sm text-slate-500">Nenhuma alteração</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="max-w-[200px] truncate sm:max-w-xs">{errorMessage}</span>
            </div>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saveStatus === 'saving' || hasErrors || !professionalId || !hasUnsavedChanges}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#9FE870] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
