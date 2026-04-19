'use client'

import { useState } from 'react'
import { upsertSessionNote } from '@/lib/actions/client-records'
import { Loader2, Plus } from 'lucide-react'

interface Props {
  bookingId: string
}

export function SessionNoteForm({ bookingId }: Props) {
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setIsSaving(true)
    const result = await upsertSessionNote(bookingId, note.trim())
    if (result.success) {
      setNote('')
      window.location.reload()
    }
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Adicionar nota de sessão..."
        rows={2}
        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm transition focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
      />
      <button
        type="submit"
        disabled={isSaving || !note.trim()}
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        Adicionar nota
      </button>
    </form>
  )
}
