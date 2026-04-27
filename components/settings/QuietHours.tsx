'use client'

import { Moon } from 'lucide-react'

interface QuietHoursConfig {
  enabled: boolean
  start: string
  end: string
}

interface Props {
  config: QuietHoursConfig
  onChange: (config: QuietHoursConfig) => void
}

export function QuietHours({ config, onChange }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100/80 px-6 py-4">
        <Moon className="h-4 w-4 text-[#9FE870]" />
        <h2 className="font-display font-bold text-slate-900">Horário de descanso</h2>
      </div>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Silenciar notificações push e e-mail</p>
            <p className="text-xs text-slate-400">
              Durante o horário de descanso, apenas notificações no app são entregues.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={config.enabled}
            onClick={() => onChange({ ...config, enabled: !config.enabled })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-200 ${
              config.enabled ? 'bg-[#9FE870]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                config.enabled ? 'translate-x-5.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {config.enabled && (
          <div className="mt-4 flex items-center gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Início</label>
              <input
                type="time"
                value={config.start}
                onChange={e => onChange({ ...config, start: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
              />
            </div>
            <span className="mt-5 text-sm text-slate-400">até</span>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Fim</label>
              <input
                type="time"
                value={config.end}
                onChange={e => onChange({ ...config, end: e.target.value })}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9FE870]/40"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
