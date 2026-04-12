'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'
import { Loader2, ArrowLeft, Check, Save, ShieldCheck } from 'lucide-react'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { saveProfessionalProfileDraft } from '@/lib/actions/professional'
import { isFeatureAvailable } from '@/lib/tier-config'
import { TierLockedOverlay } from '@/components/tier/TierLockedOverlay'

const LANGUAGE_OPTIONS = ['Português', 'English', 'Español', 'Français', 'Deutsch', 'Italiano']
const DURATION_OPTIONS = [30, 45, 50, 60, 90]

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item || '').trim()).filter(Boolean)
}

function socialLinksObjectToArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return safeArray(value)
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .map(item => String(item || '').trim())
      .filter(Boolean)
  }
  return []
}

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
  const [professionalId, setProfessionalId] = useState('')
  const [tier, setTier] = useState('basic')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('')
  const [videoIntroUrl, setVideoIntroUrl] = useState('')
  const [socialLinksInput, setSocialLinksInput] = useState('')
  const [credentialUrlsInput, setCredentialUrlsInput] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: professional } = await getPrimaryProfessionalForUser(
        supabase,
        user.id,
        'id,tier,category,bio,tags,languages,years_experience,session_price_brl,session_duration_minutes,whatsapp_number,cover_photo_url,video_intro_url,social_links',
      )

      if (!professional) {
        router.push('/completar-perfil')
        return
      }

      const { data: credentialsRows } = await supabase
        .from('professional_credentials')
        .select('file_url')
        .eq('professional_id', professional.id)
        .order('uploaded_at', { ascending: false })

      setProfessionalId(professional.id || '')
      setTier(String(professional.tier || 'basic').toLowerCase())
      setCategory(professional.category || '')
      setBio(professional.bio || '')
      setTags((professional.tags || []).join(', '))
      setLanguages(safeArray(professional.languages).length > 0 ? safeArray(professional.languages) : ['Português'])
      setYearsExperience(String(professional.years_experience || ''))
      setPriceBrl(String(professional.session_price_brl || ''))
      setDuration(Number(professional.session_duration_minutes || 60))
      setWhatsappNumber(String(professional.whatsapp_number || ''))
      setCoverPhotoUrl(String(professional.cover_photo_url || ''))
      setVideoIntroUrl(String(professional.video_intro_url || ''))
      setSocialLinksInput(socialLinksObjectToArray(professional.social_links).join('\n'))
      setCredentialUrlsInput(
        (credentialsRows || []).map(item => String(item.file_url || '').trim()).filter(Boolean).join('\n'),
      )
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const hasVideoIntroFeature = useMemo(() => isFeatureAvailable(tier, 'video_intro'), [tier])
  const hasSocialLinksFeature = useMemo(() => isFeatureAvailable(tier, 'social_links'), [tier])

  function toggleLanguage(lang: string) {
    setLanguages(prev => (prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)

    const payload = {
      professionalId,
      category,
      bio,
      tags: tags
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
      languages,
      yearsExperience: Number(yearsExperience || 0),
      sessionPriceBrl: Number(priceBrl || 0),
      sessionDurationMinutes: duration,
      whatsappNumber,
      coverPhotoUrl,
      videoIntroUrl: hasVideoIntroFeature ? videoIntroUrl : '',
      socialLinks: hasSocialLinksFeature
        ? socialLinksInput
            .split('\n')
            .map(item => item.trim())
            .filter(Boolean)
        : [],
      credentialUrls: credentialUrlsInput
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean),
    }

    const result = await saveProfessionalProfileDraft(payload)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    setTimeout(() => router.push('/perfil'), 1400)
  }

  const canSave =
    Boolean(professionalId) &&
    Boolean(category) &&
    bio.trim().length >= 20 &&
    languages.length > 0 &&
    Number(priceBrl) > 0

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center p-6 md:p-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-8">
        <Link
          href="/perfil"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao perfil
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900">Editar perfil profissional</h1>
            <p className="mt-1 text-neutral-500">
              Atualize seu perfil público e envie para revisão quando terminar.
            </p>
          </div>
          <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
            Plano {tier === 'premium' ? 'Premium' : tier === 'professional' ? 'Professional' : 'Basic'}
          </span>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-neutral-900">Categoria principal</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.slug)}
              className={`rounded-xl border-2 p-3 text-center transition-all ${
                category === cat.slug
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="mb-1 text-2xl">{cat.icon}</div>
              <div className="text-xs font-medium text-neutral-700">{cat.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-neutral-900">Sobre você</h2>
        <p className="mb-4 text-sm text-neutral-500">Descreva sua experiência e seu foco de atuação.</p>
        <textarea
          value={bio}
          onChange={event => setBio(event.target.value)}
          rows={5}
          placeholder="Ex.: Psicóloga clínica com foco em ansiedade, burnout e regulação emocional."
          className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <p className="mt-2 text-xs text-neutral-400">{bio.length}/5000 caracteres (mínimo 20)</p>
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-neutral-900">Foco de atuação</h2>
        <p className="mb-4 text-sm text-neutral-500">Separe as tags por vírgula.</p>
        <input
          type="text"
          value={tags}
          onChange={event => setTags(event.target.value)}
          placeholder="ansiedade, liderança, carreira"
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-neutral-900">Idiomas de atendimento</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                languages.includes(lang)
                  ? 'bg-brand-500 text-white'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
              }`}
            >
              {languages.includes(lang) && <Check className="mr-1 inline h-3.5 w-3.5" />}
              {lang}
            </button>
          ))}
        </div>
      </div>

      <TierLockedOverlay
        currentTier={tier}
        requiredTier="professional"
        featureName="Vídeo de apresentação e links sociais"
      >
        <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-neutral-900">Diferenciais públicos</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">URL do vídeo de apresentação</label>
              <input
                type="url"
                value={videoIntroUrl}
                onChange={event => setVideoIntroUrl(event.target.value)}
                placeholder="https://youtube.com/... ou https://vimeo.com/..."
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">Links sociais (1 por linha)</label>
              <textarea
                value={socialLinksInput}
                onChange={event => setSocialLinksInput(event.target.value)}
                rows={4}
                placeholder="https://instagram.com/...\nhttps://linkedin.com/in/..."
                className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        </div>
      </TierLockedOverlay>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-neutral-900">Credenciais e certificados</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Adicione URLs dos documentos para validação administrativa (1 por linha).
        </p>
        <textarea
          value={credentialUrlsInput}
          onChange={event => setCredentialUrlsInput(event.target.value)}
          rows={4}
          placeholder="https://.../diploma.pdf"
          className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 placeholder-neutral-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-neutral-900">Formato da sessão</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Preço da sessão (BRL)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">R$</span>
              <input
                type="number"
                value={priceBrl}
                onChange={event => setPriceBrl(event.target.value)}
                min="10"
                step="1"
                className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-neutral-900 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Duração da sessão</label>
            <div className="grid grid-cols-5 gap-2">
              {DURATION_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDuration(option)}
                  className={`rounded-xl py-2 text-sm font-medium transition-all ${
                    duration === option
                      ? 'bg-brand-500 text-white'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  {option}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm text-amber-700">
          Ao salvar, seu perfil volta para revisão administrativa antes de aparecer na busca.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}

      {success ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="h-4 w-4" />
          Perfil atualizado com sucesso. Redirecionando...
        </div>
      ) : null}

      {!hasVideoIntroFeature || !hasSocialLinksFeature ? (
        <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <p className="inline-flex items-center gap-2 text-sm text-brand-700">
            <ShieldCheck className="h-4 w-4" />
            Alguns diferenciais estão disponíveis apenas no plano Professional ou Premium.
          </p>
          <Link
            href="/planos"
            className="mt-2 inline-flex text-sm font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            Ver planos
          </Link>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !canSave}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" /> Salvar alterações
          </>
        )}
      </button>
    </div>
  )
}
