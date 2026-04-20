'use client'

import { useEffect, useState, useCallback } from 'react'
import { ThumbsUp, AlertTriangle, X, Send } from 'lucide-react'
import {
  getGuideUsefulCount,
  toggleGuideUseful,
  submitGuideReport,
} from '@/lib/actions/guide-feedback'
import { ScrollReveal } from '@/components/landing/ScrollReveal'

function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('muuday_visitor_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('muuday_visitor_id', id)
  }
  return id
}

export function GuideFeedback({ guideSlug }: { guideSlug: string }) {
  const [usefulCount, setUsefulCount] = useState(0)
  const [hasMarkedUseful, setHasMarkedUseful] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportMessage, setReportMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const visitorId = getVisitorId()

  const loadData = useCallback(async () => {
    const count = await getGuideUsefulCount(guideSlug)
    setUsefulCount(count)
  }, [guideSlug])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = `muuday_guide_useful_${guideSlug}`
    setHasMarkedUseful(localStorage.getItem(key) === '1')
  }, [guideSlug])

  async function handleUseful() {
    const result = await toggleGuideUseful(guideSlug, visitorId)
    if (result.success) {
      const key = `muuday_guide_useful_${guideSlug}`
      if (result.marked) {
        setHasMarkedUseful(true)
        setUsefulCount((c) => c + 1)
        localStorage.setItem(key, '1')
      } else {
        setHasMarkedUseful(false)
        setUsefulCount((c) => Math.max(0, c - 1))
        localStorage.removeItem(key)
      }
    }
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedbackMessage('')

    const result = await submitGuideReport(guideSlug, visitorId, reportMessage)

    if (result.success) {
      setReportMessage('')
      setShowReport(false)
      setFeedbackMessage('Obrigado! Sua observação foi registrada.')
    } else {
      setFeedbackMessage(result.error || 'Erro ao enviar.')
    }

    setIsSubmitting(false)
  }

  return (
    <ScrollReveal variant="slideUp">
      <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-bold uppercase tracking-tight text-slate-900">
              Este conteúdo foi útil?
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Seu feedback ajuda outras pessoas a encontrarem informações de qualidade.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUseful}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition ${
                hasMarkedUseful
                  ? 'border-[#9FE870] bg-[#9FE870]/20 text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-[#9FE870] hover:bg-[#9FE870]/10'
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${hasMarkedUseful ? 'fill-current' : ''}`} />
              {hasMarkedUseful ? 'Útil' : 'Marcar como útil'}
              {usefulCount > 0 && (
                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {usefulCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
            >
              <AlertTriangle className="h-4 w-4" />
              Reportar erro
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <p className="mt-4 text-sm text-green-600">{feedbackMessage}</p>
        )}

        {/* Report modal */}
        {showReport && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Reportar problema</h4>
              <button
                type="button"
                onClick={() => setShowReport(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:text-slate-700"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Descreva o erro encontrado. Vamos corrigir o mais rápido possível.
            </p>
            <form onSubmit={handleReportSubmit} className="mt-3 space-y-3">
              <textarea
                placeholder="Ex: informação desatualizada, link quebrado, erro de digitação..."
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                required
                maxLength={2000}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Enviando...' : 'Enviar relatório'}
                </button>
                <a
                  href={`mailto:hello@muuday.com?subject=Problema no guia: ${encodeURIComponent(guideSlug)}&body=${encodeURIComponent(reportMessage)}`}
                  className="text-sm font-semibold text-slate-600 underline underline-offset-2 transition hover:text-slate-900"
                >
                  Ou enviar por email
                </a>
              </div>
            </form>
          </div>
        )}
      </div>
    </ScrollReveal>
  )
}
