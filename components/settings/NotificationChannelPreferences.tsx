'use client'

import { Bell, Mail, Smartphone } from 'lucide-react'
import type { NotificationChannel, NotificationCategoryKey, NotificationPreferences } from './workspace-helpers'
import { NOTIFICATION_CATEGORIES } from './workspace-helpers'

interface Props {
  preferences: NotificationPreferences
  onToggleChannel: (categoryKey: NotificationCategoryKey, channel: NotificationChannel) => void
}

const channelMeta: { key: NotificationChannel; label: string; icon: React.ReactNode }[] = [
  { key: 'in_app', label: 'No app', icon: <Bell className="h-3.5 w-3.5" /> },
  { key: 'email', label: 'E-mail', icon: <Mail className="h-3.5 w-3.5" /> },
  { key: 'push', label: 'Push', icon: <Smartphone className="h-3.5 w-3.5" /> },
]

export function NotificationChannelPreferences({ preferences, onToggleChannel }: Props) {
  const categories = preferences.categories || {}

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100/80 px-6 py-4">
        <Bell className="h-4 w-4 text-[#9FE870]" />
        <h2 className="font-display font-bold text-slate-900">Canais de notificação</h2>
      </div>
      <div className="divide-y divide-slate-100/80">
        {NOTIFICATION_CATEGORIES.map(cat => {
          const catPrefs = categories[cat.key as keyof typeof categories]
          const activeChannels = catPrefs?.channels || cat.defaultChannels
          return (
            <div key={cat.key} className="px-6 py-4">
              <div className="mb-2">
                <p className="text-sm font-medium text-slate-700">{cat.label}</p>
                <p className="text-xs text-slate-400">{cat.desc}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {channelMeta.map(ch => {
                  const active = activeChannels.includes(ch.key)
                  return (
                    <button
                      key={ch.key}
                      type="button"
                      onClick={() => onToggleChannel(cat.key, ch.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? 'border-[#9FE870]/60 bg-[#9FE870]/8 text-[#3d6b1f]'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {ch.icon}
                      {ch.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
