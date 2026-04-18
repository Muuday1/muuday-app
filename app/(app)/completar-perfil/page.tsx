'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'

const LANGUAGE_OPTIONS = ['Português', 'English', 'Español', 'Français', 'Deutsch', 'Italiano']
const DURATION_OPTIONS = [30, 45, 50, 60, 90]

async function upsertPrimaryService(
  professionalId: string,
  bio: string,
  category: string,
  duration: number,
  priceBrl: number,
) {
  const supabase = createClient()

  const { data: existingService, error: findServiceError } = await supabase
    .from('professional_services')
    .select('id')
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (findServiceError) return

  const categoryLabel = CATEGORIES.find(c => c.slug === category)?.name || 'serviço profissional'
  const payload = {
    professional_id: professionalId,
    name: `Sessão principal (${categoryLabel})`,
    service_type: 'one_off',
    description: bio?.trim() || 'Sessão profissional na Muuday',
    duration_minutes: duration,
    price_brl: priceBrl,
    enable_recurring: false,
    enable_monthly: false,
    is_active: true,
    is_draft: false,
    updated_at: new Date().toISOString(),
  }

  if (existingService?.id) {
    await supabase.from('professional_services').update(payload).eq('id', existingService.id)
    return
  }

  await supabase.from('professional_services').insert(payload)
}

export default function CompletarPerfilPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Category & Bio
  const [category, setCategory] = useState('')
  const [bio, setBio] = useState('')

  // Step 2: Details
  const [tags, setTags] = useState('')
  const [languages, setLanguages] = useState<string[]>(['Português'])
  const [yearsExperience, setYearsExperience] = useState('')

  // Step 3: Pricing
  const [priceBrl, setPriceBrl] = useState('')
  const [duration, setDuration] = useState(60)

  const totalSteps = 3

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada'); setLoading(false); return }

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)

    // Check if professional profile already exists
    const { data: existing } = await getPrimaryProfessionalForUser(supabase, user.id, 'id,status')

    const profileData = {
      bio,
      category,
      tags: tagList,
      languages,
      years_experience: parseInt(yearsExperience) || 0,
      session_price_brl: parseFloat(priceBrl) || 0,
      session_duration_minutes: duration,
      updated_at: new Date().toISOString(),
    }

    let err: Error | null = null
    let professionalId = String(existing?.id || '')
    if (existing) {
      const normalizedExistingStatus = String((existing as Record<string, unknown>)?.status || 'draft').toLowerCase()
      const statusForUpdate =
        normalizedExistingStatus === 'draft' ? 'pending_review' : normalizedExistingStatus

      const { error } = await supabase
        .from('professionals')
        .update({
          ...profileData,
          status: statusForUpdate,
        })
        .eq('id', existing.id)
      err = error
    } else {
      const { data: inserted, error } = await supabase
        .from('professionals')
        .insert({ user_id: user.id, ...profileData, status: 'pending_review' })
        .select('id')
        .single()
      professionalId = inserted?.id || ''
      err = error
    }

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    if (professionalId) {
      await upsertPrimaryService(
        professionalId,
        bio,
        category,
        duration,
        parseFloat(priceBrl) || 0,
      )
      await fetch('/api/professional/recompute-visibility', {
        method: 'POST',
        credentials: 'include',
      })
    }

    router.push('/perfil')
    router.refresh()
  }

  function toggleLanguage(lang: string) {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  const canProceed = step === 1 ? (category && bio.length >= 20)
    : step === 2 ? (languages.length > 0)
    : (parseFloat(priceBrl) > 0)

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">Completar perfil profissional</h1>
        <p className="text-neutral-500">Configure seu perfil para começar a receber clientes</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${
            s <= step ? 'bg-brand-500' : 'bg-neutral-200'
          }`} />
        ))}
      </div>

      {/* Step 1: Category & Bio */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-display font-semibold text-lg text-neutral-900 mb-4">Especialidade</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.slug)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    category === cat.slug
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-medium text-neutral-700">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-display font-semibold text-lg text-neutral-900 mb-1">Sobre você</h2>
            <p className="text-sm text-neutral-500 mb-4">Descreva sua experiência e como você pode ajudar seus clientes</p>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={5}
              placeholder="Ex: Sou psicóloga clínica com 8 anos de experiência em terapia cognitivo-comportamental. Atendo brasileiros que vivem no exterior com foco em adaptação cultural, ansiedade e depressão..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
            />
            <p className="text-xs text-neutral-400 mt-2">{bio.length}/500 caracteres (mínimo 20)</p>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-display font-semibold text-lg text-neutral-900 mb-1">Tags / Especialidades</h2>
            <p className="text-sm text-neutral-500 mb-4">Separadas por vírgula (ex: ansiedade, depressão, terapia de casal)</p>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="ansiedade, depressão, burnout"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-display font-semibold text-lg text-neutral-900 mb-4">Idiomas de atendimento</h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    languages.includes(lang)
                      ? 'bg-brand-500 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {languages.includes(lang) && <Check className="w-3.5 h-3.5 inline mr-1" />}
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-display font-semibold text-lg text-neutral-900 mb-4">Experiência</h2>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Anos de experiência</label>
              <input
                type="number"
                value={yearsExperience}
                onChange={e => setYearsExperience(e.target.value)}
                min="0"
                max="50"
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-display font-semibold text-lg text-neutral-900 mb-1">Preço da sessão</h2>
            <p className="text-sm text-neutral-500 mb-4">Valor em Reais (BRL). Clientes verão a conversão na sua moeda local.</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">R$</span>
              <input
                type="number"
                value={priceBrl}
                onChange={e => setPriceBrl(e.target.value)}
                min="10"
                step="10"
                placeholder="150.00"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-display font-semibold text-lg text-neutral-900 mb-4">Duração da sessão</h2>
            <div className="grid grid-cols-5 gap-2">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    duration === d
                      ? 'bg-brand-500 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {d}min
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-brand-50 rounded-2xl border border-brand-100 p-6">
            <h3 className="font-display font-semibold text-brand-800 mb-3">Resumo do perfil</h3>
            <div className="space-y-2 text-sm text-brand-700">
              <p><strong>Categoria:</strong> {CATEGORIES.find(c => c.slug === category)?.name}</p>
              <p><strong>Preço:</strong> R$ {parseFloat(priceBrl || '0').toFixed(2)} / {duration}min</p>
              <p><strong>Idiomas:</strong> {languages.join(', ')}</p>
              {tags && <p><strong>Tags:</strong> {tags}</p>}
            </div>
            <p className="text-xs text-brand-600 mt-3">
              Após envio, seu perfil será revisado pela equipa Muuday antes de aparecer na busca.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mt-4">
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex-1 flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold py-3 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        )}
        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
          >
            Continuar <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceed}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Check className="w-4 h-4" /> Enviar para revisão</>}
          </button>
        )}
      </div>
    </div>
  )
}

