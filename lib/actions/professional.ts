'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidateTag } from 'next/cache'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  createOrUpdateProfessionalProfile,
  saveProfessionalProfileDraft as saveProfessionalProfileDraftService,
  updateAvailability as updateAvailabilityService,
} from '@/lib/professional/professional-profile-service'

export async function createProfessionalProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rl = await rateLimit('professionalProfile', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const raw = {
    bio: formData.get('bio') as string || '',
    category: formData.get('category') as string || '',
    tags: formData.get('tags') as string || '',
    languages: formData.get('languages') as string || '',
    years_experience: formData.get('years_experience') as string || '0',
    session_price_brl: formData.get('session_price_brl') as string || '0',
    session_duration_minutes: formData.get('session_duration_minutes') as string || '60',
  }

  const result = await createOrUpdateProfessionalProfile(supabase, user.id, raw)

  if (result.error) {
    return { error: result.error }
  }

  if (result.professionalId) {
    revalidateTag('public-profiles', {})
  }

  redirect('/perfil')
}

export async function updateAvailability(slots: { day_of_week: number; start_time: string; end_time: string }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const rl = await rateLimit('availability', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const result = await updateAvailabilityService(supabase, user.id, slots)

  if (result.success) {
    revalidateTag('public-profiles', {})
  }

  return result
}

export async function saveProfessionalProfileDraft(input: {
  professionalId: string
  category: string
  bio: string
  tags: string[]
  languages: string[]
  yearsExperience: number
  sessionPriceBrl: number
  sessionDurationMinutes: number
  whatsappNumber?: string
  coverPhotoUrl?: string
  videoIntroUrl?: string
  socialLinks?: string[]
  credentialUrls?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

  const rl = await rateLimit('professionalProfile', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const result = await saveProfessionalProfileDraftService(supabase, user.id, input)

  if (result.success) {
    revalidateTag('public-profiles', {})
  }

  return result
}
