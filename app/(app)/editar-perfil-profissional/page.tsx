'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import { Loader2, ArrowLeft, Check, Save } from 'lucide-react'

const LANGUAGE_OPTIONS = ['Português', 'English', 'Español', 'Français', 'Deutsch', 'Italiano']
const DURATION_OPTIONS = [30, 45, 50, 60, 90]

export default function EditarPerfilProfissionalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [category, setCategory] = useState('')
  const [bio, setBio] = useState('')
  const [tags, setTags] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [yearsExperience, setYearsExperience] = useState('')
  const [priceBrl, setPriceBrl] = useState('')
  const [duration, setDuration] = useState(60)

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: professional } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!professional) {
        router.push('/completar-perfil')
        return
      }

      setCategory(professional.category || '')
      setBio(professional.bio || '')
      setTags(professional.tags?.join(', ') || '')
      setLanguages(professional.languages || ['Português'])
      setYearsExperience(professional.years_experience?.toString() || '')
      setPriceBrl(professional.session_price_brl?.toString() || '')
      setDuration(professional.session_duration_minutes || 60)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  function toggleLanguage(lang: string) {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada'); setSaving(false); return }

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)

    const { error: updateError } = await supabase
      .from('professionals')
      .update({
        category,
        bio,
        tags: tagList,
        languages,
        years_experience: parseInt(yearsExperience) || 0,
        session_price_brl: parseFloat(priceBrl) || 0,
        session_duration_minutes: duration,
        status: 'pending_review' as const,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => router.push('/perfil'), 1500)
  }

  const canSave = category && bio.length >= 20 && languages.length > 0 && parseFloat(priceBrl) > 0

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
          <ArrowLeft className="w-4 h-4" /> Voltar ao perfil
        </Link>
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">Editar perfil profissional</h1>
        <p className="text-neutral-500">Atualize suas informações profissionais. Alterações serão enviadas para nova revisão.</p>
      </div>

      {/* Category */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
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

      {/* Bio */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
        <h2 className="font-display font-semibold text-lg text-neutral-900 mb-1">Sobre você</h2>
        <p className="text-sm text-neutral-500 mb-4">Descreva sua experiência e como você pode ajudar seus clientes</p>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={5}
          placeholder="Ex: Sou psicóloga clínica com 8 anos de experiência..."
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
        />
        <p className="text-xs text-neutral-400 mt-2">{bio.length}/500 caracteres (mínimo 20)</p>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
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

      {/* Languages */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
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

      {/* Experience */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
        <h2 className="font-display font-semibold text-lg text-neutral-900 mb-4">Experiência</h2>
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

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
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

      {/* Duration */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
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

      {/* Notice about re-approval */}
      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 mb-6">
        <p className="text-sm text-amber-700">
          Ao salvar alterações, seu perfil será enviado para nova revisão pela equipa Muuday antes de voltar a aparecer na busca.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-600 mb-4 flex items-center gap-2">
          <Check className="w-4 h-4" /> Perfil atualizado com sucesso! Redirecionando...
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !canSave}
        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
        ) : (
          <><Save className="w-4 h-4" /> Salvar alterações</>
        )}
      </button>
    </div>
  )
}
