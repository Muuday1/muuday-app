'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminReviewProfessionalDecision } from '@/lib/actions/admin'
import {
  REVIEW_ADJUSTMENT_PRESET_FIELDS,
  REVIEW_ADJUSTMENT_STAGE_LABELS,
  type ReviewAdjustmentItemInput,
} from '@/lib/professional/review-adjustments'

type Props = {
  professionalId: string
  defaultNotes: string
}

type DraftAdjustment = ReviewAdjustmentItemInput & { selected: boolean }

export function AdminReviewDecisionForm({ professionalId, defaultNotes }: Props) {
  const router = useRouter()
  const [notes, setNotes] = useState(defaultNotes)
  const [submitting, setSubmitting] = useState<'approved' | 'needs_changes' | 'rejected' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [drafts, setDrafts] = useState<DraftAdjustment[]>(
    REVIEW_ADJUSTMENT_PRESET_FIELDS.map(item => ({
      stageId: item.stageId,
      fieldKey: item.fieldKey,
      message: '',
      severity: 'medium',
      selected: false,
    })),
  )

  const groupedFields = useMemo(() => {
    const map = new Map<string, typeof REVIEW_ADJUSTMENT_PRESET_FIELDS>()
    REVIEW_ADJUSTMENT_PRESET_FIELDS.forEach(item => {
      if (!map.has(item.stageId)) map.set(item.stageId, [])
      map.get(item.stageId)!.push(item)
    })
    return Array.from(map.entries())
  }, [])

  const selectedAdjustments = useMemo(
    () => drafts.filter(item => item.selected),
    [drafts],
  )

  function updateDraft(stageId: string, fieldKey: string, patch: Partial<DraftAdjustment>) {
    setDrafts(previous =>
      previous.map(item =>
        item.stageId === stageId && item.fieldKey === fieldKey ? { ...item, ...patch } : item,
      ),
    )
  }

  async function submitDecision(decision: 'approved' | 'needs_changes' | 'rejected') {
    setErrorMessage('')
    setSubmitting(decision)
    try {
      if (decision === 'needs_changes') {
        if (selectedAdjustments.length === 0) {
          setErrorMessage('Selecione ao menos um item de ajuste para continuar.')
          return
        }
        const missingMessage = selectedAdjustments.find(item => !item.message.trim())
        if (missingMessage) {
          setErrorMessage('Escreva uma mensagem curta para cada item selecionado.')
          return
        }
      }

      const payloadAdjustments =
        decision === 'needs_changes'
          ? selectedAdjustments.map(({ stageId, fieldKey, message, severity }) => ({
              stageId,
              fieldKey,
              message: message.trim(),
              severity,
            }))
          : []

      const result = await adminReviewProfessionalDecision(
        professionalId,
        decision,
        notes.trim(),
        payloadAdjustments,
      )

      if (!result.success) {
        setErrorMessage(result.error)
        return
      }

      router.push(`/admin/revisao/${professionalId}?result=success`)
      router.refresh()
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Nota geral (opcional)
        </span>
        <textarea
          value={notes}
          onChange={event => setNotes(event.target.value)}
          rows={4}
          maxLength={1200}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-300"
          placeholder="Resumo geral para o profissional (opcional)."
        />
      </label>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">Checklist de ajustes</p>
        <p className="mt-1 text-xs text-neutral-500">
          Para solicitar ajustes, marque os itens necessários e preencha uma mensagem objetiva para cada um.
        </p>
        <div className="mt-3 space-y-3">
          {groupedFields.map(([stageId, fields]) => (
            <div key={stageId} className="rounded-lg border border-neutral-200 bg-white p-3">
              <p className="text-xs font-semibold text-neutral-700">
                {REVIEW_ADJUSTMENT_STAGE_LABELS[stageId as keyof typeof REVIEW_ADJUSTMENT_STAGE_LABELS] ||
                  stageId}
              </p>
              <div className="mt-2 space-y-2">
                {fields.map(field => {
                  const draft =
                    drafts.find(item => item.stageId === field.stageId && item.fieldKey === field.fieldKey) ||
                    null
                  if (!draft) return null
                  return (
                    <div key={`${field.stageId}:${field.fieldKey}`} className="rounded-lg border border-neutral-200 p-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                        <input
                          type="checkbox"
                          checked={draft.selected}
                          onChange={event =>
                            updateDraft(field.stageId, field.fieldKey, { selected: event.target.checked })
                          }
                          className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                        />
                        {field.label}
                      </label>
                      {draft.selected ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={draft.message}
                            onChange={event =>
                              updateDraft(field.stageId, field.fieldKey, { message: event.target.value })
                            }
                            rows={2}
                            maxLength={600}
                            className="w-full rounded-lg border border-neutral-200 px-2.5 py-2 text-xs text-neutral-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-300"
                            placeholder="Descreva exatamente o ajuste necessário."
                          />
                          <select
                            value={draft.severity}
                            onChange={event =>
                              updateDraft(field.stageId, field.fieldKey, {
                                severity: event.target.value as DraftAdjustment['severity'],
                              })
                            }
                            className="w-full rounded-lg border border-neutral-200 px-2.5 py-2 text-xs text-neutral-700"
                          >
                            <option value="low">Baixa prioridade</option>
                            <option value="medium">Média prioridade</option>
                            <option value="high">Alta prioridade</option>
                          </select>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
      ) : null}

      <button
        type="button"
        onClick={() => void submitDecision('approved')}
        disabled={Boolean(submitting)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
      >
        Aprovar
      </button>
      <button
        type="button"
        onClick={() => void submitDecision('needs_changes')}
        disabled={Boolean(submitting)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
      >
        Solicitar ajustes
      </button>
      <button
        type="button"
        onClick={() => void submitDecision('rejected')}
        disabled={Boolean(submitting)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        Rejeitar
      </button>
    </div>
  )
}
