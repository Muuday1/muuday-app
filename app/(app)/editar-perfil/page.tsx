'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { COUNTRIES } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function EditarPerfilPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [fullName, setFullName] = useState('')
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('')
  const [currency, setCurrency] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, country, timezone, currency')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setCountry(profile.country || '')
        setTimezone(profile.timezone || '')
        setCurrency(profile.currency || '')
      }
      setLoading(false)
    }

    loadProfile()
  }, [])

  function handleCountryChange(code: string) {
    setCountry(code)
    const countryData = COUNTRIES.find(c => c.code === code)
    if (countryData) {
      setTimezone(countryData.timezone)
      setCurrency(countryData.currency)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setFeedback({ type: 'error', message: 'Sessao expirada. Faca login novamente.' })
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        country,
        timezone,
        currency,
      })
      .eq('id', user.id)

    if (error) {
      setFeedback({ type: 'error', message: 'Erro ao salvar alteracoes. Tente novamente.' })
    } else {
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao perfil
        </Link>
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">Editar Perfil</h1>
        <p className="text-neutral-500">Atualize suas informacoes pessoais</p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2.5 p-4 rounded-xl mb-6 text-sm font-medium ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-100'
            : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Nome completo
            </label>
            <input
              id="full_name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm text-neutral-900 placeholder:text-neutral-400"
              placeholder="Seu nome completo"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Pais
            </label>
            <select
              id="country"
              value={country}
              onChange={e => handleCountryChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-sm text-neutral-900 bg-white"
            >
              <option value="">Selecione um pais</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Fuso horario
            </label>
            <input
              id="timezone"
              type="text"
              value={timezone}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-500 cursor-not-allowed"
            />
            <p className="text-xs text-neutral-400 mt-1">Definido automaticamente com base no pais</p>
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-neutral-700 mb-1.5">
              Moeda
            </label>
            <input
              id="currency"
              type="text"
              value={currency}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-500 cursor-not-allowed"
            />
            <p className="text-xs text-neutral-400 mt-1">Definida automaticamente com base no pais</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <Link
            href="/perfil"
            className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Salvando...' : 'Salvar alteracoes'}
          </button>
        </div>
      </form>
    </div>
  )
}
