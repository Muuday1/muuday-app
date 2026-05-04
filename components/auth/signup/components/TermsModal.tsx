'use client'

import { PROFESSIONAL_TERMS } from '@/lib/legal/professional-terms'

interface TermsModalProps {
  activeTermKey: string | null
  scrolledToEnd: boolean
  onClose: () => void
  onAccept: () => void
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void
}

export function TermsModal({ activeTermKey, scrolledToEnd, onClose, onAccept, onScroll }: TermsModalProps) {
  const activeTerm = PROFESSIONAL_TERMS.find(item => item.key === activeTermKey) || null
  if (!activeTerm) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Leitura de termo"
    >
      <div className="w-full max-w-2xl rounded-lg bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{activeTerm.version}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{activeTerm.title}</h3>
        </div>
        <div
          className="max-h-[55vh] overflow-y-auto px-5 py-4"
          onScroll={onScroll}
        >
          {activeTerm.sections.map(section => (
            <section key={section.heading} className="mb-4">
              <h4 className="text-sm font-semibold text-slate-800">{section.heading}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-700">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50/70"
          >
            Fechar
          </button>
          <button
            type="button"
            disabled={!scrolledToEnd}
            onClick={onAccept}
            className="rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#8ed85f]"
          >
            Li ate o fim e aceito
          </button>
        </div>
      </div>
    </div>
  )
}
