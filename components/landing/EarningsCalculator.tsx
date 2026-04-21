'use client'

import { useState } from 'react'
import { Banknote, Clock, TrendingUp } from 'lucide-react'

export function EarningsCalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(10)
  const [pricePerSession, setPricePerSession] = useState(200)

  const sessionsPerWeek = hoursPerWeek
  const monthlyRevenue = sessionsPerWeek * 4 * pricePerSession
  const yearlyRevenue = monthlyRevenue * 12

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#9FE870]/20">
          <TrendingUp className="h-5 w-5 text-slate-900" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Quanto você pode ganhar?</h3>
      </div>

      <div className="mt-6 space-y-6">
        {/* Hours slider */}
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock className="h-4 w-4 text-slate-400" />
              Horas por semana
            </label>
            <span className="text-sm font-bold text-slate-900">{hoursPerWeek}h</span>
          </div>
          <input
            type="range"
            min={2}
            max={40}
            step={1}
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="mt-3 w-full accent-[#9FE870]"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>2h</span>
            <span>40h</span>
          </div>
        </div>

        {/* Price slider */}
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Banknote className="h-4 w-4 text-slate-400" />
              Valor por sessão
            </label>
            <span className="text-sm font-bold text-slate-900">R$ {pricePerSession}</span>
          </div>
          <input
            type="range"
            min={50}
            max={800}
            step={10}
            value={pricePerSession}
            onChange={(e) => setPricePerSession(Number(e.target.value))}
            className="mt-3 w-full accent-[#9FE870]"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>R$ 50</span>
            <span>R$ 800</span>
          </div>
        </div>

        {/* Result */}
        <div className="rounded-md bg-slate-900 p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Receita estimada</p>
          <p className="mt-1 font-display text-3xl font-black text-[#9FE870]">
            R$ {monthlyRevenue.toLocaleString('pt-BR')}
            <span className="text-lg font-bold text-slate-400">/mês</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            ~R$ {yearlyRevenue.toLocaleString('pt-BR')} ao ano
          </p>
        </div>
      </div>
    </div>
  )
}
