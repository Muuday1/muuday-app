'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeProfessionalProfile } from '@/lib/actions/complete-profile'
import { CATEGORIES } from '@/types'
import { Loader2, ArrowRight, ArrowLeft, Check } from 'lucide-react'

const LANGUAGE_OPTIONS = ['Português', 'English', 'Español', 'Français', 'Deutsch', 'Italiano']
const DURATION_OPTIONS = [30, 45, 50, 60, 90]

export function CompleteProfileForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [category, setCategory] = useState('')
  const [bio, setBio] = useState('')
  const [tags, setTags] = useState('')
  const [languages, setLanguages] = useState<string[]>(['Português'])
  const [yearsExperience, setYearsExperience] = useState('')
  const [priceBrl, setPriceBrl] = useState('')
  const [duration, setDuration] = useState(60)

  const totalSteps = 3

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)

    const result = await completeProfessionalProfile({
      bio,
      category,
      tags: tagList,
      languages,
      yearsExperience: parseInt(yearsExperience) || 0,
      sessionPriceBrl: parseFloat(priceBrl) || 0,
      sessionDurationMinutes: duration,
    })

    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Erro ao salvar perfil.')
      return
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
        <h1 className="font-display font-bold text-3xl text-slate-900 mb-1">Completar perfil profissional</h1>
        <p className="text-slate-500">Configure seu perfil para começar a receber clientes</p>
      </div>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${
            s <= step ? 'bg-[#9FE870]' : 'bg-slate-200'
          }`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200/80 p-6">
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-4">Especialidade</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.slug)}
                  className={`p-3 rounded-md border-2 text-center transition-all ${
                    category === cat.slug
                      ? 'border-[#9FE870] bg-[#9FE870]/8'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs font-medium text-slate-700">{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200/80 p-6">
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-1">Sobre você</h2>
            <p className="text-sm text-slate-500 mb-4">Descreva sua experiência e como você pode ajudar seus clientes</p>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={5}
              placeholder="Ex: Sou psicóloga clínica com 8 anos de experiência em terapia cognitivo-comportamental. Atendo brasileiros que vivem no exterior com foco em adaptação cultural, ansiedade e depressão..."
              className="w-full px-4 py-3 rounded-md border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 focus:border-[#9FE870] transition-all resize-none"
            />
            <p className="text-xs text-slate-400 mt-2">{bio.length}/500 caracteres (mínimo 20)</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200/80 p-6">
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-1">Tags / Especialidades</h2>
            <p className="text-sm text-slate-500 mb-4">Separadas por vírgula (ex: ansiedade, depressão, terapia de casal)</p>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="ansiedade, depressão, burnout"
              className="w-full px-4 py-3 rounded-md border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 focus:border-[#9FE870] transition-all"
            />
          </div>

          <div className="bg-white rounded-lg border border-slate-200/80 p-6">
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-4">Idiomas de atendimento</h2>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    languages.includes(lang)
                      ? 'bg-[#9FE870] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {languages.includes(lang) && <Check className="w-3.5 h-3.5 inline mr-1" />}
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200/80 p-6">
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-4">Experiência</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Anos de experiência</label>
              <input
                type="number"
                value={yearsExperience}
                onChange={e => setYearsExperience(e.target.value)}
                min="0"
                max="50"
                placeholder="0"
                className="w-full px-4 py-3 rounded-md border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 focus:border-[#9FE870] transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200/80 p-6">
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-1">Preço da sessão</h2>
            <p className="text-sm text-slate-500 mb-4">Valor em Reais (BRL). Clientes verão a conversão na sua moeda local.</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
              <input
                type="number"
                value={priceBrl}
                onChange={e => setPriceBrl(e.target.value)}
                min="10"
                step="10"
                placeholder="150.00"
                className="w-full pl-12 pr-4 py-3 rounded-md border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9FE870]/20 focus:border-[#9FE870] transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200/80 p-6">
            <h2 className="font-display font-semibold text-lg text-slate-900 mb-4">Duração da sessão</h2>
            <div className="grid grid-cols-5 gap-2">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-md text-sm font-medium transition-all ${
                    duration === d
                      ? 'bg-[#9FE870] text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {d}min
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#9FE870]/8 rounded-lg border border-[#9FE870]/20 p-6">
            <h3 className="font-display font-semibold text-[#2d5016] mb-3">Resumo do perfil</h3>
            <div className="space-y-2 text-sm text-[#3d6b1f]">
              <p><strong>Categoria:</strong> {CATEGORIES.find(c => c.slug === category)?.name}</p>
              <p><strong>Preço:</strong> R$ {parseFloat(priceBrl || '0').toFixed(2)} / {duration}min</p>
              <p><strong>Idiomas:</strong> {languages.join(', ')}</p>
              {tags && <p><strong>Tags:</strong> {tags}</p>}
            </div>
            <p className="text-xs text-[#3d6b1f] mt-3">
              Após envio, seu perfil será revisado pela equipa Muuday antes de aparecer na busca.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-600 mt-4">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50/70 text-slate-700 font-semibold py-3 rounded-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        )}
        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed}
            className="flex-1 flex items-center justify-center gap-2 bg-[#9FE870] hover:bg-[#8ed85f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition-all"
          >
            Continuar <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceed}
            className="flex-1 flex items-center justify-center gap-2 bg-[#9FE870] hover:bg-[#8ed85f] disabled:opacity-60 text-white font-semibold py-3 rounded-md transition-all"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Check className="w-4 h-4" /> Enviar para revisão</>}
          </button>
        )}
      </div>
    </div>
  )
}
