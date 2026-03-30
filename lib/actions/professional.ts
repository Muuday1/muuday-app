'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { z } from 'zod'

const VALID_CATEGORIES = [
  'saude-mental-bem-estar', 'saude-corpo-movimento', 'educacao-desenvolvimento',
  'contabilidade-financas', 'direito-suporte-juridico', 'carreira-negocios-desenvolvimento',
  'traducao-suporte-documental', 'outro',
  // Legacy slugs (backward compatibility)
  'psicologia', 'direito', 'contabilidade', 'nutricao',
  'fisioterapia', 'educacao', 'coaching', 'medicina',
] as const

const professionalSchema = z.object({
  bio: z.string().trim().min(10, 'Bio muito curta').max(2000, 'Bio muito longa'),
  category: z.enum(VALID_CATEGORIES, { errorMap: () => ({ message: 'Categoria inválida' }) }),
  tags: z.string().transform(s => s.split(',').map(t => t.trim()).filter(Boolean)).pipe(
    z.array(z.string().max(50)).max(20, 'Máximo 20 tags')
  ),
  languages: z.string().transform(s => s.split(',').map(l => l.trim()).filter(Boolean)).pipe(
    z.array(z.string().max(50)).max(10, 'Máximo 10 idiomas')
  ),
  years_experience: z.coerce.number().int().min(0).max(60),
  session_price_brl: z.coerce.number().min(0).max(50000),
  session_duration_minutes: z.coerce.number().int().min(15).max(480),
})

export async function createProfessionalProfile(formData: FormData) {
  const supabase = createClient()
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

  const parsed = professionalSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Dados inválidos'
    return { error: firstError }
  }

  const { bio, category, tags, languages, years_experience: yearsExperience, session_price_brl: sessionPriceBrl, session_duration_minutes: sessionDurationMinutes } = parsed.data

  // Check if professional profile already exists
  const { data: existing } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('professionals')
      .update({
        bio,
        category,
        tags,
        languages: languages.length > 0 ? languages : ['Português'],
        years_experience: yearsExperience,
        session_price_brl: sessionPriceBrl,
        session_duration_minutes: sessionDurationMinutes,
        status: 'pending_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    // Create new
    const { error } = await supabase
      .from('professionals')
      .insert({
        user_id: user.id,
        bio,
        category,
        tags,
        languages: languages.length > 0 ? languages : ['Português'],
        years_experience: yearsExperience,
        session_price_brl: sessionPriceBrl,
        session_duration_minutes: sessionDurationMinutes,
        status: 'pending_review',
      })

    if (error) return { error: error.message }
  }

  redirect('/perfil')
}

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const slotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(timeRegex, 'Horário inválido (HH:MM)'),
  end_time: z.string().regex(timeRegex, 'Horário inválido (HH:MM)'),
}).refine(s => s.start_time < s.end_time, { message: 'Horário início deve ser antes do fim' })

const slotsSchema = z.array(slotSchema).max(50, 'Máximo 50 horários')

export async function updateAvailability(slots: { day_of_week: number; start_time: string; end_time: string }[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const rl = await rateLimit('availability', user.id)
  if (!rl.allowed) return { error: 'Muitas tentativas. Tente novamente em breve.' }

  const parsed = slotsSchema.safeParse(slots)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Dados inválidos'
    return { error: firstError }
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!professional) return { error: 'Perfil profissional não encontrado' }

  // Delete existing availability
  await supabase
    .from('availability')
    .delete()
    .eq('professional_id', professional.id)

  // Insert new slots
  if (parsed.data.length > 0) {
    const { error } = await supabase
      .from('availability')
      .insert(parsed.data.map(slot => ({
        professional_id: professional.id,
        ...slot,
      })))

    if (error) return { error: error.message }
  }

  return { success: true }
}
