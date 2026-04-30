'use client'

import * as Sentry from '@sentry/nextjs'
import { useState, useCallback } from 'react'
import { ArrowLeft, Save, Check } from 'lucide-react'
import Link from 'next/link'
import { updateProfileField } from '@/lib/actions/user-profile'
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATIONS,
  NotificationChannel,
  NotificationCategoryKey,
} from './workspace-helpers'
import { NotificationChannelPreferences } from './NotificationChannelPreferences'
import { QuietHours } from './QuietHours'

interface Props {
  initialPreferences?: NotificationPreferences
}

export function NotificationPreferencesPage({ initialPreferences }: Props) {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATIONS,
    ...initialPreferences,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleToggleChannel = useCallback(
    (category: NotificationCategoryKey, channel: NotificationChannel) => {
      setPrefs(prev => {
        const cats = prev.categories || {}
        const cat = cats[category] || { channels: [] }
        const current = new Set(cat.channels || [])
        if (current.has(channel)) current.delete(channel)
        else current.add(channel)
        return {
          ...prev,
          categories: {
            ...cats,
            [category]: { channels: Array.from(current) },
          },
        }
      })
    },
    []
  )

  const handleQuietHoursChange = useCallback(
    (config: { enabled: boolean; start: string; end: string }) => {
      setPrefs(prev => ({ ...prev, quiet_hours: config }))
    },
    []
  )

  async function handleSave() {
    setSaving(true)
    const result = await updateProfileField('notification_preferences', prefs)
    setSaving(false)
    if (result.error) {
      Sentry.captureMessage(`[NotificationPreferencesPage] save error: ${result.error}`, {
        level: 'error',
        tags: { area: 'notification_preferences_page', context: 'save' },
      })
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Link
        href="/configuracoes"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar às configurações
      </Link>

      <NotificationChannelPreferences
        preferences={prefs}
        onToggleChannel={handleToggleChannel}
      />

      <QuietHours
        config={prefs.quiet_hours || DEFAULT_NOTIFICATIONS.quiet_hours!}
        onChange={handleQuietHoursChange}
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <Check className="h-4 w-4" />
            Salvo
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#9FE870] px-5 py-2.5 font-display text-sm font-bold text-[#163300] shadow-sm transition hover:bg-[#8CD960] disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#163300]/20 border-t-[#163300]" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar preferências
            </>
          )}
        </button>
      </div>
    </div>
  )
}
