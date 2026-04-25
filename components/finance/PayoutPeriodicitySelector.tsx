'use client'

import { useState } from 'react'
import { CalendarDays, ChevronDown, Check } from 'lucide-react'
import { updatePayoutPeriodicity } from '@/lib/actions/professional-payout'
import type { PayoutPeriodicity } from '@/lib/payments/fees/calculator'

interface PayoutPeriodicitySelectorProps {
  currentPeriodicity: PayoutPeriodicity
}

const OPTIONS: { value: PayoutPeriodicity; label: string; description: string }[] = [
  {
    value: 'weekly',
    label: 'Semanal',
    description: 'Receba seus pagamentos toda semana',
  },
  {
    value: 'biweekly',
    label: 'Quinzenal',
    description: 'Receba seus pagamentos a cada 2 semanas',
  },
  {
    value: 'monthly',
    label: 'Mensal',
    description: 'Receba seus pagamentos uma vez por mês',
  },
]

export function PayoutPeriodicitySelector({ currentPeriodicity }: PayoutPeriodicitySelectorProps) {
  const [selected, setSelected] = useState<PayoutPeriodicity>(currentPeriodicity)
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(value: PayoutPeriodicity) {
    if (value === selected) {
      setIsOpen(false)
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const result = await updatePayoutPeriodicity(value)
      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        setSelected(value)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
      setIsOpen(false)
    }
  }

  const currentOption = OPTIONS.find((o) => o.value === selected)

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <CalendarDays className="w-4 h-4 text-[#9FE870]" />
        Frequência de pagamento
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={saving}
          className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-left text-sm transition-all hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/30 disabled:opacity-50"
        >
          <div>
            <span className="font-medium text-slate-900">{currentOption?.label}</span>
            <span className="block text-xs text-slate-500">{currentOption?.description}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="mt-0.5">
                  {selected === option.value ? (
                    <Check className="w-4 h-4 text-[#9FE870]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </div>
                <div>
                  <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                  <span className="block text-xs text-slate-500">{option.description}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {saved && (
        <p className="text-xs text-green-600 font-medium">Frequência atualizada com sucesso!</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
