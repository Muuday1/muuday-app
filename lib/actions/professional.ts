'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProfessionalProfile(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bio = formData.get('bio') as string
  const category = formData.get('category') as string
  const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean)
  const languages = (formData.get('languages') as string).split(',').map(l => l.trim()).filter(Boolean)
  const yearsExperience = parseInt(formData.get('years_experience') as string) || 0
  const sessionPriceBrl = parseFloat(formData.get('session_price_brl') as string) || 0
  const sessionDurationMinutes = parseInt(formData.get('session_duration_minutes') as string) || 60

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

export async function updateAvailability(slots: { day_of_week: number; start_time: string; end_time: string }[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

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
  if (slots.length > 0) {
    const { error } = await supabase
      .from('availability')
      .insert(slots.map(slot => ({
        professional_id: professional.id,
        ...slot,
      })))

    if (error) return { error: error.message }
  }

  return { success: true }
}
