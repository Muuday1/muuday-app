import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { ProfessionalProfileEditForm } from '@/components/professional/ProfessionalProfileEditForm'

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

export default async function EditarPerfilProfissionalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: professional } = await getPrimaryProfessionalForUser(
    supabase,
    user.id,
    'id,tier,category,bio,tags,languages,years_experience,session_price_brl,session_duration_minutes,whatsapp_number,cover_photo_url,video_intro_url,social_links',
  )

  if (!professional) {
    redirect('/completar-perfil')
  }

  const { data: credentialsRows } = await supabase
    .from('professional_credentials')
    .select('file_url')
    .eq('professional_id', professional.id)
    .order('uploaded_at', { ascending: false })

  const initialData = {
    professionalId: professional.id || '',
    tier: String(professional.tier || 'basic').toLowerCase(),
    category: professional.category || '',
    bio: professional.bio || '',
    tags: (professional.tags || []).join(', '),
    languages: safeArray(professional.languages).length > 0 ? safeArray(professional.languages) : ['Português'],
    yearsExperience: String(professional.years_experience || ''),
    sessionPriceBrl: String(professional.session_price_brl || ''),
    sessionDurationMinutes: Number(professional.session_duration_minutes || 60),
    whatsappNumber: String(professional.whatsapp_number || ''),
    coverPhotoUrl: String(professional.cover_photo_url || ''),
    videoIntroUrl: String(professional.video_intro_url || ''),
    socialLinksInput: socialLinksObjectToArray(professional.social_links).join('\n'),
    credentialUrlsInput: (credentialsRows || [])
      .map(item => String(item.file_url || '').trim())
      .filter(Boolean)
      .join('\n'),
  }

  return <ProfessionalProfileEditForm initialData={initialData} />
}
