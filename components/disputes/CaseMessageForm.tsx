'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { addCaseMessage } from '@/lib/actions/disputes'

export function CaseMessageForm({ caseId }: { caseId: string }) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    const result = await addCaseMessage(caseId, text)

    if (result.success) {
      setContent('')
      window.location.reload()
    } else {
      setError(result.error || 'Erro ao enviar mensagem.')
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Adicione uma mensagem..."
        maxLength={2000}
        rows={2}
        className="flex-1 rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
      />
      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[#9FE870] text-white transition hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Enviar mensagem"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </form>
  )
}
