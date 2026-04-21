'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CATEGORIES } from '@/types'
import { Loader2, ArrowLeft, Check, Save, ShieldCheck } from 'lucide-react'
import { saveProfessionalProfileDraft } from '@/lib/actions/professional'
import { isFeatureAvailable } from '@/lib/tier-config'
import { TierLockedOverlay } from '@/components/tier/TierLockedOverlay'

const LANGUAGE_OPTIONS = ['Português', 'English', 'Español', 'Français', 'Deutsch', 'Italiano']
const DURATION_OPTIONS = [30, 45, 50, 60, 90]

export interface ProfessionalProfileEditFormProps {
  initialData: {
    professionalId: string
    tier: string
    category: string
    bio: string
    tags: string
    languages: string[]
    yearsExperience: string
    sessionPriceBrl: string
    sessionDurationMinutes: number
    whatsappNumber: string
    coverPhotoUrl: string
    videoIntroUrl: string
    socialLinksInput: string
    credentialUrlsInput: string
  }
}

export function ProfessionalProfileEditForm({ initialData }: ProfessionalProfileEditFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [category, setCategory] = useState(initialData.category)
  const [bio, setBio] = useState(initialData.bio)
  const [tags, setTags] = useState(initialData.tags)
  const [languages, setLanguages] = useState<string[]>(initialData.languages)
  const [yearsExperience, setYearsExperience] = useState(initialData.yearsExperience)
  const [priceBrl, setPriceBrl] = useState(initialData.sessionPriceBrl)
  const [duration, setDuration] = useState(initialData.sessionDurationMinutes)
  const [whatsappNumber, setWhatsappNumber] = useState(initialData.whatsappNumber)
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initialData.coverPhotoUrl)
  const [videoIntroUrl, setVideoIntroUrl] = useState(initialData.videoIntroUrl)
  const [socialLinksInput, setSocialLinksInput] = useState(initialData.socialLinksInput)
  const [credentialUrlsInput, setCredentialUrlsInput] = useState(initialData.credentialUrlsInput)

  const tier = initialData.tier

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
      professionalId: initialData.professionalId,
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
    Boolean(initialData.professionalId) &&
    Boolean(category) &&
    bio.trim().length >= 20 &&
    languages.length > 0 &&
    Number(priceBrl) > 0

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-8">
        <Link
          href="/perfil"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao perfil
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">Editar perfil profissional</h1>
            <p className="mt-1 text-slate-500">
              Atualize seu perfil público e envie para revisão quando terminar.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
            Plano {tier === 'premium' ? 'Premium' : tier === 'professional' ? 'Professional' : 'Basic'}
          </span>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Categoria principal</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.slug)}
              className={`rounded-md border-2 p-3 text-center transition-all ${
                category === cat.slug
                  ? 'border-[#9FE870] bg-[#9FE870]/8'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="mb-1 text-2xl">{cat.icon}</div>
              <div className="text-xs font-medium text-slate-700">{cat.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-slate-900">Sobre você</h2>
        <p className="mb-4 text-sm text-slate-500">Descreva sua experiência e seu foco de atuação.</p>
        <textarea
          value={bio}
          onChange={event => setBio(event.target.value)}
          rows={5}
          placeholder="Ex.: Psicóloga clínica com foco em ansiedade, burnout e regulação emocional."
          className="w-full resize-none rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
        />
        <p className="mt-2 text-xs text-slate-400">{bio.length}/5000 caracteres (mínimo 20)</p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-slate-900">Foco de atuação</h2>
        <p className="mb-4 text-sm text-slate-500">Separe as tags por vírgula.</p>
        <input
          type="text"
          value={tags}
          onChange={event => setTags(event.target.value)}
          placeholder="ansiedade, liderança, carreira"
          className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
        />
      </div>

      <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Idiomas de atendimento</h2>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                languages.includes(lang)
                  ? 'bg-[#9FE870] text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
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
        <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Diferenciais públicos</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">URL do vídeo de apresentação</label>
              <input
                type="url"
                value={videoIntroUrl}
                onChange={event => setVideoIntroUrl(event.target.value)}
                placeholder="https://youtube.com/... ou https://vimeo.com/..."
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Links sociais (1 por linha)</label>
              <textarea
                value={socialLinksInput}
                onChange={event => setSocialLinksInput(event.target.value)}
                rows={4}
                placeholder="https://instagram.com/...\nhttps://linkedin.com/in/..."
                className="w-full resize-none rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
              />
            </div>
          </div>
        </div>
      </TierLockedOverlay>

      <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-slate-900">Credenciais e certificados</h2>
        <p className="mb-4 text-sm text-slate-500">
          Adicione URLs dos documentos para validação administrativa (1 por linha).
        </p>
        <textarea
          value={credentialUrlsInput}
          onChange={event => setCredentialUrlsInput(event.target.value)}
          rows={4}
          placeholder="https://.../diploma.pdf"
          className="w-full resize-none rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
        />
      </div>

      <div className="mb-6 rounded-lg border border-slate-200/80 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">Formato da sessão</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Preço da sessão (BRL)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
              <input
                type="number"
                value={priceBrl}
                onChange={event => setPriceBrl(event.target.value)}
                min="10"
                step="1"
                className="w-full rounded-md border border-slate-200 bg-white py-3 pl-12 pr-4 text-slate-900 transition-all focus:border-[#9FE870] focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Duração da sessão</label>
            <div className="grid grid-cols-5 gap-2">
              {DURATION_OPTIONS.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDuration(option)}
                  className={`rounded-md py-2 text-sm font-medium transition-all ${
                    duration === option
                      ? 'bg-[#9FE870] text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {option}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm text-amber-700">
          Ao salvar, seu perfil volta para revisão administrativa antes de aparecer na busca.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}

      {success ? (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="h-4 w-4" />
          Perfil atualizado com sucesso. Redirecionando...
        </div>
      ) : null}

      {!hasVideoIntroFeature || !hasSocialLinksFeature ? (
        <div className="mb-4 rounded-lg border border-[#9FE870]/20 bg-[#9FE870]/8 p-4">
          <p className="inline-flex items-center gap-2 text-sm text-[#3d6b1f]">
            <ShieldCheck className="h-4 w-4" />
            Alguns diferenciais estão disponíveis apenas no plano Professional ou Premium.
          </p>
          <Link
            href="/planos"
            className="mt-2 inline-flex text-sm font-semibold text-[#3d6b1f] underline-offset-2 hover:underline"
          >
            Ver planos
          </Link>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !canSave}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-[#9FE870] py-3 font-semibold text-white transition-all hover:bg-[#8ed85f] disabled:cursor-not-allowed disabled:opacity-60"
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
