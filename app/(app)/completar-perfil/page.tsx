import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteProfileForm } from '@/components/professional/CompleteProfileForm'

export const metadata = { title: 'Completar Perfil | Muuday' }

interface DefaultValues {
  category?: string
  bio?: string
  tags?: string
  languages?: string[]
  yearsExperience?: string
  priceBrl?: string
  duration?: number
}

function extractSignupDefaults(metadata: Record<string, unknown>): DefaultValues {
  const defaults: DefaultValues = {}

  const category = typeof metadata.professional_category === 'string' ? metadata.professional_category : undefined
  if (category && category !== 'outro') {
    defaults.category = category
  }

  const headline = typeof metadata.professional_headline === 'string' ? metadata.professional_headline : undefined
  if (headline) {
    defaults.bio = headline
  }

  const focusAreas = Array.isArray(metadata.professional_focus_areas)
    ? metadata.professional_focus_areas.filter((item): item is string => typeof item === 'string')
    : undefined
  if (focusAreas && focusAreas.length > 0) {
    defaults.tags = focusAreas.join(', ')
  }

  const primaryLanguage = typeof metadata.professional_primary_language === 'string'
    ? metadata.professional_primary_language
    : undefined
  const secondaryLanguages = Array.isArray(metadata.professional_secondary_languages)
    ? metadata.professional_secondary_languages.filter((item): item is string => typeof item === 'string')
    : []
  const allLanguages = Array.isArray(metadata.professional_languages)
    ? metadata.professional_languages.filter((item): item is string => typeof item === 'string')
    : []

  if (allLanguages.length > 0) {
    defaults.languages = allLanguages
  } else if (primaryLanguage) {
    defaults.languages = [primaryLanguage, ...secondaryLanguages]
  }

  const yearsExperience = typeof metadata.professional_years_experience === 'number'
    ? metadata.professional_years_experience
    : typeof metadata.professional_years_experience === 'string'
      ? parseInt(metadata.professional_years_experience, 10)
      : undefined
  if (yearsExperience !== undefined && !Number.isNaN(yearsExperience)) {
    defaults.yearsExperience = String(yearsExperience)
  }

  const sessionPrice = typeof metadata.professional_session_price === 'number'
    ? metadata.professional_session_price
    : typeof metadata.professional_session_price === 'string'
      ? parseFloat(metadata.professional_session_price)
      : undefined
  if (sessionPrice !== undefined && !Number.isNaN(sessionPrice) && sessionPrice > 0) {
    defaults.priceBrl = String(sessionPrice)
  }

  const sessionDuration = typeof metadata.professional_session_duration_minutes === 'number'
    ? metadata.professional_session_duration_minutes
    : typeof metadata.professional_session_duration_minutes === 'string'
      ? parseInt(metadata.professional_session_duration_minutes, 10)
      : undefined
  if (sessionDuration !== undefined && !Number.isNaN(sessionDuration) && sessionDuration > 0) {
    defaults.duration = sessionDuration
  }

  return defaults
}

export default async function CompletarPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/completar-perfil')
  }

  // Verify the user is a professional
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'profissional') {
    redirect('/buscar')
  }

  // Extract signup metadata defaults
  const metadata = (user.user_metadata || {}) as Record<string, unknown>
  const defaultValues = extractSignupDefaults(metadata)
  const hasPreFilledData = Object.keys(defaultValues).length > 0

  return (
    <>
      {hasPreFilledData && (
        <div className="max-w-2xl mx-auto px-6 pt-6">
          <div className="rounded-md border border-[#9FE870]/20 bg-[#9FE870]/8 px-4 py-3 text-sm text-[#3d6b1f]">
            Preenchemos alguns campos com as informações do seu cadastro. Verifique e complete os dados.
          </div>
        </div>
      )}
      <CompleteProfileForm defaultValues={defaultValues} />
    </>
  )
}
