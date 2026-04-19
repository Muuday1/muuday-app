'use client'

import { Bell } from 'lucide-react'
import { NOTIFICATION_ITEMS, NotificationPreferences } from './workspace-helpers'

interface NotificationSettingsProps {
  preferences: NotificationPreferences
  onToggle: (key: keyof NotificationPreferences) => void
}

export function NotificationSettings({ preferences, onToggle }: NotificationSettingsProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">
      <div className="flex items-center gap-3 border-b border-neutral-50 px-6 py-4">
        <Bell className="h-4 w-4 text-brand-500" />
        <h2 className="font-display font-bold text-neutral-900">Notificações por e-mail</h2>
      </div>
      <div className="divide-y divide-neutral-50">
        {NOTIFICATION_ITEMS.map(item => {
          const active = preferences[item.key]
          return (
            <div
              key={item.key}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50/50"
            >
              <div className="mr-4 flex-1">
                <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{item.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => onToggle(item.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-200 ${
                  active ? 'bg-brand-500' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    active ? 'translate-x-5.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
