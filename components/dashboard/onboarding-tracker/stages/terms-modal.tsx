'use client'

import { PROFESSIONAL_TERMS } from '@/lib/legal/professional-terms'

interface TermsModalProps {
  activeTermKey: string | null
  termsModalScrolledToEnd: boolean
  contentRef: React.RefObject<HTMLDivElement>
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void
  onClose: () => void
  onAccept: () => void
}

export function TermsModal({
  activeTermKey,
  termsModalScrolledToEnd,
  contentRef,
  onScroll,
  onClose,
  onAccept,
}: TermsModalProps) {
  const activeTerm = PROFESSIONAL_TERMS.find(item => item.key === activeTermKey) || null

  if (!activeTerm) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-neutral-900/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Leitura de termo"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-neutral-900">{activeTerm.title}</h3>
        </div>
        <div
          ref={contentRef}
          className="max-h-[55vh] overflow-y-auto px-5 py-4"
          onScroll={onScroll}
        >
          {activeTerm.sections.map(section => (
            <section key={section.heading} className="mb-4">
              <h4 className="text-sm font-semibold text-neutral-800">{section.heading}</h4>
              <p className="mt-1 text-sm leading-6 text-neutral-700">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-neutral-300"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={!termsModalScrolledToEnd}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {termsModalScrolledToEnd ? 'Aceitar termo' : 'Role até o fim para aceitar'}
          </button>
        </div>
      </div>
    </div>
  )
}
