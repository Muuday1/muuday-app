'use client'

import { useState } from 'react'
import { upsertClientRecord } from '@/lib/actions/client-records'
import { Loader2, Check, Save } from 'lucide-react'

interface Props {
  userId: string
  initialNotes: string
}

export function ClientRecordForm({ userId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    setSaved(false)
    const result = await upsertClientRecord(userId, notes)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Anotações gerais sobre o cliente..."
        rows={4}
        className="w-full rounded-md border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm transition focus:border-[#9FE870]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#9FE870] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ed85f] disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
