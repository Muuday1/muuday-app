'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, CheckCircle2, Circle, Loader2, Sparkles, XCircle } from 'lucide-react'
import { getTierLimits } from '@/lib/tier-config'

type Blocker = {
  code: string
  title: string
  description: string
  actionHref?: string
}

type Stage = {
  id: string
  title: string
  complete: boolean
  blockers: Blocker[]
}

type OnboardingEvaluation = {
  stages: Stage[]
}

type ServiceOption = {
  id: string
  slug: string
  name_pt: string
}

type OnboardingTrackerModalProps = {
  professionalId: string
  tier: string
  onboardingEvaluation: OnboardingEvaluation
  initialBio: string
  initialCoverPhotoUrl: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const BUSINESS_STAGE_ORDER = [
  'c1_create_account',
  'c2_professional_identity',
  'c6_plan_billing_setup_pre',
  'c3_public_profile',
  'c4_services',
  'c5_availability_calendar',
  'c6_plan_billing_setup_post',
  'c7_payout_receipt',
  'c8_submit_review',
  'c9_go_live',
] as const

const BUSINESS_STAGE_LABELS: Record<string, string> = {
  c1_create_account: '1. Criação da conta',
  c2_professional_identity: '2. Identidade profissional',
  c3_public_profile: '3. Perfil público',
  c4_services: '4. Serviços',
  c5_availability_calendar: '5. Disponibilidade e calendário',
  c6_plan_billing_setup_pre: '6. Plano, termos e cobrança',
  c6_plan_billing_setup_post: '6. Plano, termos e cobrança',
  c7_payout_receipt: '7. Payout e recebimentos',
  c8_submit_review: '8. Envio para análise',
  c9_go_live: '9. Go-live',
}

function normalizeStageIdForLookup(id: string) {
  if (id === 'c6_plan_billing_setup_pre' || id === 'c6_plan_billing_setup_post') {
    return 'c6_plan_billing_setup'
  }
  return id
}

function isValidCoverPhotoUrl(value: string) {
  if (!value) return true
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function toKeywords(value: string) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

export function OnboardingTrackerModal({
  professionalId,
  tier,
  onboardingEvaluation,
  initialBio,
  initialCoverPhotoUrl,
}: OnboardingTrackerModalProps) {
  const supabase = useMemo(() => createClient(), [])
  const [open, setOpen] = useState(false)
  const [activeStageId, setActiveStageId] = useState<string>('c1_create_account')
  const [bio, setBio] = useState(initialBio || '')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initialCoverPhotoUrl || '')
  const [bioSaveState, setBioSaveState] = useState<SaveState>('idle')
  const [bioError, setBioError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceDuration, setServiceDuration] = useState('60')
  const [serviceOptionId, setServiceOptionId] = useState('')
  const [customServiceSuggestion, setCustomServiceSuggestion] = useState('')
  const [services, setServices] = useState<
    Array<{ id: string; name: string; description: string | null; price_brl: number; duration_minutes: number }>
  >([])
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([])
  const [serviceSaveState, setServiceSaveState] = useState<SaveState>('idle')
  const [serviceError, setServiceError] = useState('')
  const [subcategorySlug, setSubcategorySlug] = useState('')
  const [planPricing, setPlanPricing] = useState<{
    currency: string
    monthlyAmount: number
    annualAmount: number
    provider: string
  } | null>(null)
  const [pricingError, setPricingError] = useState('')
  const [loadingContext, setLoadingContext] = useState(false)

  const stagesById = useMemo(() => {
    const map = new Map<string, Stage>()
    onboardingEvaluation.stages.forEach(stage => map.set(stage.id, stage))
    return map
  }, [onboardingEvaluation.stages])

  const firstPendingStageId = useMemo(() => {
    const firstPending = BUSINESS_STAGE_ORDER.find(id => {
      const stage = stagesById.get(normalizeStageIdForLookup(id))
      return stage ? !stage.complete : false
    })
    return firstPending || 'c1_create_account'
  }, [stagesById])

  const tierLimits = useMemo(() => getTierLimits(String(tier || 'basic').toLowerCase()), [tier])

  useEffect(() => {
    if (!open) return
    setActiveStageId(firstPendingStageId)
  }, [open, firstPendingStageId])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    let mounted = true
    async function loadModalContext() {
      setLoadingContext(true)

      const [{ data: professional }, { data: existingServices }] = await Promise.all([
        supabase
          .from('professionals')
          .select('subcategories')
          .eq('id', professionalId)
          .maybeSingle(),
        supabase
          .from('professional_services')
          .select('id,name,description,price_brl,duration_minutes')
          .eq('professional_id', professionalId)
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
      ])

      const mainSubcategory = Array.isArray(professional?.subcategories)
        ? String(professional.subcategories[0] || '')
        : ''

      if (mounted) {
        setSubcategorySlug(mainSubcategory)
        setServices((existingServices || []) as Array<{ id: string; name: string; description: string | null; price_brl: number; duration_minutes: number }>)
      }

      if (mainSubcategory) {
        const { data: options } = await supabase
          .from('taxonomy_service_options')
          .select('id,slug,name_pt')
          .eq('subcategory_slug', mainSubcategory)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

        if (mounted) {
          setServiceOptions((options || []) as ServiceOption[])
        }
      }

      const pricingResponse = await fetch('/api/professional/plan-pricing', {
        method: 'GET',
        credentials: 'include',
      })
      if (mounted) {
        if (pricingResponse.ok) {
          const pricingJson = (await pricingResponse.json()) as {
            currency: string
            monthlyAmount: number
            annualAmount: number
            provider: string
          }
          setPlanPricing(pricingJson)
          setPricingError('')
        } else {
          const errorBody = await pricingResponse.json().catch(() => ({}))
          setPlanPricing(null)
          setPricingError(String(errorBody?.error || 'Não foi possível carregar preços agora.'))
        }
      }

      if (mounted) {
        setLoadingContext(false)
      }
    }

    void loadModalContext()

    return () => {
      mounted = false
    }
  }, [open, professionalId, supabase])

  const stageItems = useMemo(() => {
    return BUSINESS_STAGE_ORDER.map(id => {
      const stage = stagesById.get(normalizeStageIdForLookup(id))
      return {
        id,
        label: BUSINESS_STAGE_LABELS[id],
        complete: Boolean(stage?.complete),
        blocker: stage?.blockers[0] || null,
      }
    })
  }, [stagesById])

  const activeStage = stagesById.get(normalizeStageIdForLookup(activeStageId))

  async function handleRewriteBioWithAi() {
    setAiLoading(true)
    setBioError('')
    try {
      const response = await fetch('/api/professional/rewrite-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bio }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(String(data?.error || 'Falha ao melhorar texto com IA.'))
      }

      const rewritten = String(data?.bio || '').slice(0, 500)
      setBio(rewritten)
    } catch (error) {
      setBioError(error instanceof Error ? error.message : 'Falha ao melhorar texto com IA.')
    } finally {
      setAiLoading(false)
    }
  }

  async function savePublicProfile() {
    if (bio.trim().length === 0) {
      setBioError('O campo "Sobre você" não pode ficar vazio.')
      setBioSaveState('error')
      return
    }
    if (bio.length > 500) {
      setBioError('O campo "Sobre você" deve ter no máximo 500 caracteres.')
      setBioSaveState('error')
      return
    }
    if (!isValidCoverPhotoUrl(coverPhotoUrl.trim())) {
      setBioError('A URL da foto de capa é inválida.')
      setBioSaveState('error')
      return
    }

    setBioSaveState('saving')
    setBioError('')
    const { error } = await supabase
      .from('professionals')
      .update({
        bio: bio.trim(),
        cover_photo_url: coverPhotoUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', professionalId)

    if (error) {
      setBioSaveState('error')
      setBioError('Não foi possível salvar o perfil público.')
      return
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setBioSaveState('saved')
    setTimeout(() => setBioSaveState('idle'), 2000)
  }

  async function saveService() {
    const maxServices = tierLimits.services
    if (services.length >= maxServices) {
      setServiceSaveState('error')
      setServiceError(`Seu plano permite até ${maxServices} serviço(s) ativo(s).`)
      return
    }
    if (!serviceName.trim()) {
      setServiceSaveState('error')
      setServiceError('Informe um título para o serviço.')
      return
    }
    if (!serviceDescription.trim()) {
      setServiceSaveState('error')
      setServiceError('Informe uma descrição para o serviço.')
      return
    }
    const price = Number(servicePrice)
    const duration = Number(serviceDuration)
    if (!Number.isFinite(price) || price <= 0) {
      setServiceSaveState('error')
      setServiceError('Informe um preço válido em BRL.')
      return
    }
    if (!Number.isFinite(duration) || duration < 15 || duration > 240) {
      setServiceSaveState('error')
      setServiceError('Duração inválida. Use entre 15 e 240 minutos.')
      return
    }

    setServiceSaveState('saving')
    setServiceError('')

    const selectedOption = serviceOptions.find(option => option.id === serviceOptionId)
    const keywords = toKeywords(serviceDescription)

    const insertPayload = {
      professional_id: professionalId,
      name: serviceName.trim(),
      service_type: 'one_off',
      description: serviceDescription.trim(),
      duration_minutes: duration,
      price_brl: price,
      enable_recurring: false,
      enable_monthly: false,
      is_active: true,
      is_draft: false,
      category: selectedOption?.name_pt || null,
      tags: keywords.slice(0, tierLimits.serviceOptionsPerService),
      updated_at: new Date().toISOString(),
    }

    const { data: inserted, error } = await supabase
      .from('professional_services')
      .insert(insertPayload)
      .select('id,name,description,price_brl,duration_minutes')
      .single()

    if (error) {
      setServiceSaveState('error')
      setServiceError('Não foi possível criar o serviço.')
      return
    }

    if (customServiceSuggestion.trim()) {
      const { data: application } = await supabase
        .from('professional_applications')
        .select('id,taxonomy_suggestions')
        .eq('professional_id', professionalId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (application?.id) {
        const currentSuggestions =
          application.taxonomy_suggestions && typeof application.taxonomy_suggestions === 'object'
            ? (application.taxonomy_suggestions as Record<string, unknown>)
            : {}
        const currentServiceSuggestions = Array.isArray(currentSuggestions.service_options)
          ? (currentSuggestions.service_options as Array<Record<string, unknown>>)
          : []
        const nextServiceSuggestions = [
          ...currentServiceSuggestions,
          {
            subcategory_slug: subcategorySlug || null,
            suggested_name: customServiceSuggestion.trim(),
            created_from: 'onboarding_tracker_modal',
            created_at: new Date().toISOString(),
          },
        ]
        await supabase
          .from('professional_applications')
          .update({
            taxonomy_suggestions: {
              ...currentSuggestions,
              service_options: nextServiceSuggestions,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', application.id)
      }
    }

    await fetch('/api/professional/recompute-visibility', {
      method: 'POST',
      credentials: 'include',
    })

    setServices(prev => [...prev, inserted as { id: string; name: string; description: string | null; price_brl: number; duration_minutes: number }])
    setServiceName('')
    setServiceDescription('')
    setServicePrice('')
    setServiceDuration('60')
    setServiceOptionId('')
    setCustomServiceSuggestion('')
    setServiceSaveState('saved')
    setTimeout(() => setServiceSaveState('idle'), 2000)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
      >
        Abrir tracker de onboarding
        <ArrowRight className="h-4 w-4" />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-neutral-900/55 px-3 py-4"
          role="dialog"
          aria-modal="true"
          aria-label="Tracker de onboarding profissional"
        >
          <div className="grid h-[92vh] w-full max-w-7xl grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200 bg-white md:grid-cols-[260px_1fr]">
            <aside className="border-b border-neutral-100 bg-neutral-50 p-3 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">Tracker de onboarding</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
                >
                  Fechar
                </button>
              </div>
              <nav className="space-y-1">
                {stageItems.map(item => {
                  const isActive = item.id === activeStageId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveStageId(item.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                        isActive
                          ? 'border-brand-300 bg-brand-50 text-brand-800'
                          : item.complete
                            ? 'border-green-200 bg-green-50 text-green-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {item.complete ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : item.blocker ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                        <span className="font-semibold">{item.label}</span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </aside>

            <section className="overflow-y-auto p-4 md:p-6">
              <div className="mb-4">
                <h2 className="font-display text-xl font-bold text-neutral-900">
                  {BUSINESS_STAGE_LABELS[activeStageId]}
                </h2>
                {activeStage?.complete ? (
                  <p className="mt-1 text-sm text-green-700">Etapa concluída.</p>
                ) : (
                  <p className="mt-1 text-sm text-amber-700">
                    {activeStage?.blockers[0]?.description || 'Existem pendências nesta etapa.'}
                  </p>
                )}
              </div>

              {loadingContext ? (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando dados do tracker...
                  </span>
                </div>
              ) : null}

              {(activeStageId === 'c3_public_profile') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-semibold text-neutral-900">Sobre você</label>
                      <span className="text-xs text-neutral-500">{bio.length}/500</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={event => setBio(event.target.value.slice(0, 500))}
                      rows={6}
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      placeholder="Descreva sua atuação profissional em linguagem clara e objetiva."
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleRewriteBioWithAi()}
                        disabled={aiLoading}
                        className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
                      >
                        {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        Melhorar texto com IA
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <label className="mb-2 block text-sm font-semibold text-neutral-900">
                      URL da foto de capa (consistência visual)
                    </label>
                    <input
                      type="url"
                      value={coverPhotoUrl}
                      onChange={event => setCoverPhotoUrl(event.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                    <p className="mt-2 text-xs text-neutral-500">
                      Nesta fase aplicamos consistência básica de URL/formato. Edição de foto com IA fica para um próximo bloco.
                    </p>
                  </div>

                  {bioError ? (
                    <p className="text-sm font-medium text-red-700">{bioError}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void savePublicProfile()}
                    disabled={bioSaveState === 'saving'}
                    className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {bioSaveState === 'saving' ? 'Salvando...' : bioSaveState === 'saved' ? 'Salvo' : 'Salvar perfil público'}
                  </button>
                </div>
              )}

              {(activeStageId === 'c4_services') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-700">
                      Limite do plano atual: <strong>{tierLimits.services} serviço(s)</strong> ativo(s).
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Serviços cadastrados: {services.length}/{tierLimits.services}
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-neutral-900">Adicionar serviço</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Título</label>
                        <input
                          type="text"
                          value={serviceName}
                          onChange={event => setServiceName(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                          placeholder="Ex.: Sessão de orientação fiscal internacional"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Descrição</label>
                        <textarea
                          rows={4}
                          value={serviceDescription}
                          onChange={event => setServiceDescription(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                          placeholder="Explique o objetivo, formato e resultado esperado do serviço."
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Preço por sessão (BRL)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={servicePrice}
                          onChange={event => setServicePrice(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Duração (minutos)</label>
                        <select
                          value={serviceDuration}
                          onChange={event => setServiceDuration(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        >
                          {[30, 45, 50, 60, 75, 90, 120].map(option => (
                            <option key={option} value={option}>
                              {option} min
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Serviço sugerido (catálogo)</label>
                        <select
                          value={serviceOptionId}
                          onChange={event => setServiceOptionId(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        >
                          <option value="">Selecione...</option>
                          {serviceOptions.map(option => (
                            <option key={option.id} value={option.id}>
                              {option.name_pt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-neutral-700">Outro (sugestão para admin)</label>
                        <input
                          type="text"
                          value={customServiceSuggestion}
                          onChange={event => setCustomServiceSuggestion(event.target.value)}
                          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                          placeholder="Nome do serviço que não encontrou"
                        />
                      </div>
                    </div>

                    {serviceError ? <p className="mt-3 text-sm font-medium text-red-700">{serviceError}</p> : null}

                    <button
                      type="button"
                      onClick={() => void saveService()}
                      disabled={serviceSaveState === 'saving'}
                      className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      {serviceSaveState === 'saving' ? 'Salvando...' : serviceSaveState === 'saved' ? 'Salvo' : 'Adicionar serviço'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-neutral-900">Serviços ativos</h3>
                    {services.length === 0 ? (
                      <p className="text-sm text-neutral-500">Nenhum serviço ativo ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {services.map(service => (
                          <div key={service.id} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
                            <p className="text-sm font-semibold text-neutral-900">{service.name}</p>
                            <p className="text-xs text-neutral-600">{service.description || 'Sem descrição'}</p>
                            <p className="mt-1 text-xs text-neutral-700">
                              R$ {Number(service.price_brl || 0).toFixed(2)} · {service.duration_minutes} min
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(activeStageId === 'c5_availability_calendar') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <p className="text-sm text-neutral-700">
                      O setup de disponibilidade e calendário continua no editor completo, com suporte a regras de antecedência,
                      recorrência, modo de confirmação e sincronização.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href="/disponibilidade" className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600">
                        Abrir disponibilidade
                      </Link>
                      <Link href="/configuracoes-agendamento" className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-brand-300 hover:text-brand-700">
                        Abrir regras de agendamento
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {(activeStageId === 'c6_plan_billing_setup_pre' || activeStageId === 'c6_plan_billing_setup_post') && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-neutral-900">Plano e cobrança</h3>
                    {planPricing ? (
                      <div className="mt-2 space-y-1 text-sm text-neutral-700">
                        <p>
                          Mensal: <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: planPricing.currency }).format(planPricing.monthlyAmount / 100)}</strong>
                        </p>
                        <p>
                          Anual (10x): <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: planPricing.currency }).format(planPricing.annualAmount / 100)}</strong>
                        </p>
                        <p className="text-xs text-neutral-500">Fonte de preço: {planPricing.provider}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-neutral-600">{pricingError || 'Preço não disponível no momento.'}</p>
                    )}
                    <p className="mt-2 text-xs text-neutral-500">
                      Profissional não possui plano grátis. O trial e a assinatura dependem de cartão válido.
                    </p>
                    <Link href="/planos" className="mt-3 inline-flex rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600">
                      Abrir planos e cobrança
                    </Link>
                  </div>
                </div>
              )}

              {!['c3_public_profile', 'c4_services', 'c5_availability_calendar', 'c6_plan_billing_setup_pre', 'c6_plan_billing_setup_post'].includes(activeStageId) ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-sm text-neutral-700">
                    Esta etapa usa os mesmos gates do backend. Você pode corrigir pendências pelos links abaixo.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {(activeStage?.blockers || []).map(blocker => (
                      <li key={blocker.code} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                        <p className="font-semibold text-neutral-900">{blocker.title}</p>
                        <p className="mt-1">{blocker.description}</p>
                        {blocker.actionHref ? (
                          <Link href={blocker.actionHref} className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800">
                            Corrigir
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}
    </>
  )
}
