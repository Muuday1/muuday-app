'use client'

import { PROFESSIONAL_TERMS } from '@/lib/legal/professional-terms'
import type { FieldErrors } from '../../types'

interface TermsSectionProps {
  professionalTermsAccepted: Record<string, boolean>
  fieldErrors: FieldErrors
  onToggleTermsCheckbox: (key: string) => void
  onOpenTermsModal: (key: string) => void
}

export function TermsSection({
  professionalTermsAccepted,
  fieldErrors,
  onToggleTermsCheckbox,
  onOpenTermsModal,
}: TermsSectionProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Termos obrigatorios antes do envio</h3>
      <p className="mt-1 text-xs text-slate-600">
        Para enviar o cadastro, abra cada termo, leia ate o fim e clique em aceitar.
      </p>
      <div className="mt-3 space-y-2">
        {PROFESSIONAL_TERMS.map(term => {
          const accepted = professionalTermsAccepted[term.key]
          return (
            <div key={term.key} className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={() => onToggleTermsCheckbox(term.key)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]"
                  />
                  <span>{term.shortLabel}</span>
                </label>
                <button
                  type="button"
                  onClick={() => onOpenTermsModal(term.key)}
                  className="text-xs font-semibold text-[#3d6b1f] underline"
                >
                  Abrir termo
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {fieldErrors.professionalTerms && (
        <p className="mt-2 text-xs text-red-600">{fieldErrors.professionalTerms}</p>
      )}
    </div>
  )
}
