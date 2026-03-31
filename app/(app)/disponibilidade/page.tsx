'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, Clock, AlertCircle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

// day_of_week: 0=Sunday, 1=Monday, ..., 6=Saturday
// We display Mon-Sun (1-6, 0) but store as 0-6
const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
]

const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 23; h++) {
  for (const m of [0, 30]) {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    TIME_OPTIONS.push(`${hh}:${mm}`)
  }
}

type DayAvailability = {
  is_available: boolean
  start_time: string
  end_time: string
}

type AvailabilityState = Record<number, DayAvailability>

const DEFAULT_DAY: DayAvailability = {
  is_available: false,
  start_time: '09:00',
  end_time: '18:00',
}

function buildDefaultState(): AvailabilityState {
  const state: AvailabilityState = {}
  for (const day of DAYS_OF_WEEK) {
    state[day.value] = { ...DEFAULT_DAY }
  }
  return state
}

type SaveStatus = 'idle' | 'saving' | 'success' | 'error'

export default function DisponibilidadePage() {
  const router = useRouter()
  const [availability, setAvailability] = useState<AvailabilityState>(buildDefaultState())
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)

  const loadAvailability = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Verify user has professional role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'profissional') {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    // Get professional profile
    const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')

    if (!professional) {
      setAccessDenied(true)
      setLoading(false)
      return
    }

    setProfessionalId(professional.id)

    // Load existing availability
    const { data: rows } = await supabase
      .from('availability')
      .select('*')
      .eq('professional_id', professional.id)

    if (rows && rows.length > 0) {
      const newState = buildDefaultState()
      for (const row of rows) {
        newState[row.day_of_week] = {
          is_available: Boolean(row.is_active ?? row.is_available),
          start_time: row.start_time.slice(0, 5), // "HH:MM:SS" -> "HH:MM"
          end_time: row.end_time.slice(0, 5),
        }
      }
      setAvailability(newState)
    }

    setLoading(false)
  }, [router])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  function toggleDay(dayValue: number) {
    setAvailability(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        is_available: !prev[dayValue].is_available,
      },
    }))
  }

  function updateTime(dayValue: number, field: 'start_time' | 'end_time', value: string) {
    setAvailability(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value,
      },
    }))
  }

  function isValidTimeRange(day: DayAvailability): boolean {
    if (!day.is_available) return true
    return day.start_time < day.end_time
  }

  const hasErrors = DAYS_OF_WEEK.some(d => !isValidTimeRange(availability[d.value]))

  async function handleSave() {
    if (!professionalId || hasErrors) return

    setSaveStatus('saving')
    setErrorMessage('')

    const supabase = createClient()

    // Build rows to upsert (only available days)
    const rowsToUpsert = DAYS_OF_WEEK
      .map(day => ({
        professional_id: professionalId,
        day_of_week: day.value,
        start_time: availability[day.value].start_time + ':00',
        end_time: availability[day.value].end_time + ':00',
        is_active: availability[day.value].is_available,
      }))

    // Delete existing rows and insert new ones (clean upsert)
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('professional_id', professionalId)

    if (deleteError) {
      setErrorMessage('Erro ao salvar. Tente novamente.')
      setSaveStatus('error')
      return
    }

    const { error: insertError } = await supabase
      .from('availability')
      .insert(rowsToUpsert)

    if (insertError) {
      setErrorMessage('Erro ao salvar. Tente novamente.')
      setSaveStatus('error')
      return
    }

    setSaveStatus('success')
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="font-display font-bold text-xl text-neutral-900 mb-2">Acesso restrito</h2>
          <p className="text-neutral-500 text-sm mb-6">
            Esta página é exclusiva para profissionais com perfil completo.
          </p>
          <Link
            href="/completar-perfil"
            className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
          >
            Completar perfil profissional
          </Link>
        </div>
      </div>
    )
  }

  const activeDaysCount = DAYS_OF_WEEK.filter(d => availability[d.value].is_available).length

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao perfil
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">
              Disponibilidade
            </h1>
            <p className="text-neutral-500">
              Configure os dias e horários em que você atende clientes
            </p>
          </div>
          {activeDaysCount > 0 && (
            <span className="flex-shrink-0 text-xs font-medium bg-brand-50 text-brand-700 px-3 py-1.5 rounded-full">
              {activeDaysCount} {activeDaysCount === 1 ? 'dia ativo' : 'dias ativos'}
            </span>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <Clock className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-brand-700">
          Os horários são exibidos para clientes no fuso horário local deles. Configure os dias em que você está disponível para sessões.
        </p>
      </div>

      <div className="mb-6">
        <Link
          href="/configuracoes-agendamento"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 hover:border-neutral-300 px-4 py-2 rounded-xl transition-all"
        >
          Ajustar regras de agendamento
        </Link>
      </div>

      {/* Weekly schedule */}
      <div className="space-y-3 mb-6">
        {DAYS_OF_WEEK.map(day => {
          const dayData = availability[day.value]
          const isEnabled = dayData.is_available
          const hasError = !isValidTimeRange(dayData)

          return (
            <div
              key={day.value}
              className={`bg-white rounded-2xl border transition-all ${
                isEnabled
                  ? hasError
                    ? 'border-red-200 shadow-sm'
                    : 'border-brand-100 shadow-sm'
                  : 'border-neutral-100'
              }`}
            >
              {/* Day header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  aria-label={isEnabled ? `Desativar ${day.label}` : `Ativar ${day.label}`}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                    isEnabled ? 'bg-brand-500' : 'bg-neutral-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Day name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm transition-colors ${
                    isEnabled ? 'text-neutral-900' : 'text-neutral-400'
                  }`}>
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.short}</span>
                  </p>
                  {!isEnabled && (
                    <p className="text-xs text-neutral-300 hidden sm:block">Indisponível</p>
                  )}
                </div>

                {/* Time selectors - shown inline on desktop, stacked on mobile */}
                {isEnabled && (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-neutral-400 whitespace-nowrap hidden sm:block">De</label>
                      <select
                        value={dayData.start_time}
                        onChange={e => updateTime(day.value, 'start_time', e.target.value)}
                        className={`text-sm border rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                          hasError ? 'border-red-300 text-red-600' : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <span className="text-neutral-300 text-sm">-</span>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-neutral-400 whitespace-nowrap hidden sm:block">Até</label>
                      <select
                        value={dayData.end_time}
                        onChange={e => updateTime(day.value, 'end_time', e.target.value)}
                        className={`text-sm border rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                          hasError ? 'border-red-300 text-red-600' : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {TIME_OPTIONS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Disabled state placeholder */}
                {!isEnabled && (
                  <span className="text-xs text-neutral-300 font-medium">Inativo</span>
                )}
              </div>

              {/* Error message */}
              {isEnabled && hasError && (
                <div className="px-5 pb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-500">
                    O horário de início deve ser anterior ao horário de fim
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick select shortcuts */}
      <div className="bg-white rounded-2xl border border-neutral-100 px-5 py-4 mb-6">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Atalhos</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setAvailability(prev => {
                const next = { ...prev }
                // Mon-Fri
                for (const day of [1, 2, 3, 4, 5]) {
                  next[day] = { is_available: true, start_time: '09:00', end_time: '18:00' }
                }
                // Sat-Sun
                for (const day of [6, 0]) {
                  next[day] = { ...next[day], is_available: false }
                }
                return next
              })
            }}
            className="text-sm px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all"
          >
            Segunda a Sexta
          </button>
          <button
            type="button"
            onClick={() => {
              setAvailability(prev => {
                const next = { ...prev }
                for (const day of DAYS_OF_WEEK) {
                  next[day.value] = { is_available: true, start_time: '09:00', end_time: '18:00' }
                }
                return next
              })
            }}
            className="text-sm px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-all"
          >
            Todos os dias
          </button>
          <button
            type="button"
            onClick={() => {
              setAvailability(buildDefaultState())
            }}
            className="text-sm px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            Limpar tudo
          </button>
        </div>
      </div>

      {/* Error message */}
      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Success message */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 mb-4 flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          Disponibilidade salva com sucesso!
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saveStatus === 'saving' || hasErrors || !professionalId}
        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm"
      >
        {saveStatus === 'saving' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando...
          </>
        ) : saveStatus === 'success' ? (
          <>
            <Check className="w-4 h-4" />
            Salvo!
          </>
        ) : (
          'Salvar disponibilidade'
        )}
      </button>
    </div>
  )
}


