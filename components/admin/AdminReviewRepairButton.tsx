'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { adminRestoreLatestReviewAdjustments } from '@/lib/actions/admin'

type Props = {
  professionalId: string
}

export function AdminReviewRepairButton({ professionalId }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleRepair() {
    setSubmitting(true)
    setErrorMessage('')
    try {
      const result = await adminRestoreLatestReviewAdjustments(professionalId)
      if (!result.success) {
        setErrorMessage(result.error)
        return
      }
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">Revisão devolvida sem itens ativos</p>
      <p className="mt-1 text-xs text-amber-800">
        Este perfil está em revisão devolvida, mas não há ajustes estruturados abertos. Você pode restaurar a última
        rodada suportada ou emitir uma nova revisão estruturada abaixo.
      </p>
      {errorMessage ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void handleRepair()}
        disabled={submitting}
        className="mt-3 inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {submitting ? 'Restaurando...' : 'Restaurar última rodada de ajustes'}
      </button>
    </div>
  )
}
