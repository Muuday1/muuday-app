'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, Save } from 'lucide-react'
import type { PlanConfigMap, PlanConfig } from '@/lib/plan-config'
import { savePlanConfigs } from '@/lib/actions/admin-plans'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const FEATURE_OPTIONS = [
  { key: 'cover_photo', label: 'Foto de capa' },
  { key: 'manual_accept', label: 'Confirmação manual' },
  { key: 'auto_accept', label: 'Aceite automático' },
  { key: 'video_intro', label: 'Vídeo de apresentação' },
  { key: 'whatsapp_profile', label: 'WhatsApp no perfil' },
  { key: 'social_links', label: 'Links sociais' },
  { key: 'extended_bio', label: 'Bio estendida' },
  { key: 'outlook_sync', label: 'Sincronização Outlook' },
  { key: 'whatsapp_notifications', label: 'Notificações WhatsApp' },
  { key: 'promotions', label: 'Promoções' },
  { key: 'csv_export', label: 'Exportar CSV' },
  { key: 'pdf_export', label: 'Exportar PDF' },
] as const

const TIERS: Array<{ key: keyof PlanConfigMap; label: string }> = [
  { key: 'basic', label: 'Básico' },
  { key: 'professional', label: 'Profissional' },
  { key: 'premium', label: 'Premium' },
]

function clonePlans(plans: PlanConfigMap): PlanConfigMap {
  return JSON.parse(JSON.stringify(plans)) as PlanConfigMap
}

function numberInput(
  value: number,
  onChange: (next: number) => void,
  min = 0,
  className = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
) {
  return (
    <input
      type="number"
      min={min}
      value={Number.isFinite(value) ? value : 0}
      onChange={event => onChange(Number(event.target.value || 0))}
      className={className}
    />
  )
}

export interface AdminPlanConfigFormProps {
  initialPlans: PlanConfigMap
}

export function AdminPlanConfigForm({ initialPlans }: AdminPlanConfigFormProps) {
  const [plans, setPlans] = useState<PlanConfigMap>(initialPlans)
  const [activeTier, setActiveTier] = useState<keyof PlanConfigMap>('basic')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const tierConfig = useMemo(() => plans[activeTier], [activeTier, plans])

  function updateTier(mutator: (draft: PlanConfig) => void) {
    setPlans(current => {
      const next = clonePlans(current)
      mutator(next[activeTier])
      return next
    })
    setSaveState('idle')
  }

  async function handleSave() {
    setSaveState('saving')
    setErrorMessage('')
    const result = await savePlanConfigs(plans)
    if (!result.ok) {
      setSaveState('error')
      setErrorMessage(result.error)
      return
    }
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 2500)
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <Link
            href="/admin"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar ao admin
          </Link>
          <h1 className="font-display text-2xl font-bold text-slate-900">Admin &gt; Planos</h1>
          <p className="text-sm text-slate-500">
            Ajuste limites e recursos por tier sem alterar código.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="inline-flex items-center gap-2 rounded-md bg-[#9FE870] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saveState === 'saved' ? 'Salvo' : saveState === 'saving' ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {errorMessage ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="mb-4 flex gap-2">
        {TIERS.map(tier => (
          <button
            key={tier.key}
            onClick={() => setActiveTier(tier.key)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              activeTier === tier.key
                ? 'bg-[#9FE870] text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-[#9FE870]/40 hover:text-[#3d6b1f]'
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200/80 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Configuração do plano {TIERS.find(t => t.key === activeTier)?.label}</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-700">
            Serviços ativos
            <div className="mt-1">
              {numberInput(tierConfig.limits.services, next => updateTier(d => { d.limits.services = Math.max(0, Math.floor(next)) }), 0)}
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Tags de foco
            <div className="mt-1">
              {numberInput(tierConfig.limits.tags, next => updateTier(d => { d.limits.tags = Math.max(0, Math.floor(next)) }), 0)}
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Especialidades
            <div className="mt-1">
              {numberInput(tierConfig.limits.specialties, next => updateTier(d => { d.limits.specialties = Math.max(0, Math.floor(next)) }), 0)}
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Opções por serviço
            <div className="mt-1">
              {numberInput(tierConfig.limits.serviceOptionsPerService, next => updateTier(d => { d.limits.serviceOptionsPerService = Math.max(0, Math.floor(next)) }), 0)}
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Janela máxima (dias)
            <div className="mt-1">
              {numberInput(tierConfig.limits.bookingWindowDays, next => updateTier(d => { d.limits.bookingWindowDays = Math.max(1, Math.floor(next)) }), 1)}
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Limite de links sociais
            <div className="mt-1">
              {numberInput(tierConfig.socialLinksLimit, next => updateTier(d => { d.socialLinksLimit = Math.max(0, Math.floor(next)) }), 0)}
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Bio estendida (caracteres)
            <div className="mt-1">
              {numberInput(tierConfig.extendedBioLimit, next => updateTier(d => { d.extendedBioLimit = Math.max(0, Math.floor(next)) }), 0)}
            </div>
          </label>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-700">
            Antecedência mínima (h)
            <div className="mt-1">
              {numberInput(tierConfig.minNoticeRange.min, next => updateTier(d => {
                d.minNoticeRange.min = Math.max(0, Math.floor(next))
                d.minNoticeRange.max = Math.max(d.minNoticeRange.max, d.minNoticeRange.min)
              }), 0)}
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Antecedência máxima (h)
            <div className="mt-1">
              {numberInput(tierConfig.minNoticeRange.max, next => updateTier(d => { d.minNoticeRange.max = Math.max(d.minNoticeRange.min, Math.floor(next)) }), 0)}
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Buffer máximo (min)
            <div className="mt-1">
              {numberInput(tierConfig.bufferConfig.maxMinutes, next => updateTier(d => {
                d.bufferConfig.maxMinutes = Math.max(d.bufferConfig.defaultMinutes, Math.floor(next))
              }), 0)}
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Buffer padrão (min)
            <div className="mt-1">
              {numberInput(tierConfig.bufferConfig.defaultMinutes, next => updateTier(d => {
                d.bufferConfig.defaultMinutes = Math.max(0, Math.floor(next))
                d.bufferConfig.maxMinutes = Math.max(d.bufferConfig.maxMinutes, d.bufferConfig.defaultMinutes)
              }), 0)}
            </div>
          </label>
          <label className="mt-6 inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={tierConfig.bufferConfig.configurable}
              onChange={event => updateTier(d => { d.bufferConfig.configurable = event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/30"
            />
            Buffer configurável pelo profissional
          </label>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-700">Recursos habilitados</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {FEATURE_OPTIONS.map(feature => (
              <label key={feature.key} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={tierConfig.features.includes(feature.key)}
                  onChange={event =>
                    updateTier(d => {
                      if (event.target.checked) {
                        if (!d.features.includes(feature.key)) d.features.push(feature.key)
                      } else {
                        d.features = d.features.filter(item => item !== feature.key)
                      }
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[#9FE870] focus:ring-[#9FE870]/30"
                />
                {feature.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
