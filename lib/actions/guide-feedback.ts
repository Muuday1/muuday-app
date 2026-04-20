'use server'

import { createClient } from '@/lib/supabase/server'

export async function getGuideUsefulCount(guideSlug: string) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('guide_feedback')
    .select('*', { count: 'exact', head: true })
    .eq('guide_slug', guideSlug)
    .eq('feedback_type', 'useful')

  if (error) {
    console.error('getGuideUsefulCount error:', error)
    return 0
  }
  return count || 0
}

export async function toggleGuideUseful(guideSlug: string, visitorId: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('guide_feedback')
    .select('id')
    .eq('guide_slug', guideSlug)
    .eq('visitor_id', visitorId)
    .eq('feedback_type', 'useful')
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('guide_feedback')
      .delete()
      .eq('id', existing.id)

    if (error) {
      console.error('toggleGuideUseful delete error:', error)
      return { success: false, marked: true }
    }
    return { success: true, marked: false }
  }

  const { error } = await supabase.from('guide_feedback').insert({
    guide_slug: guideSlug,
    visitor_id: visitorId,
    feedback_type: 'useful',
  })

  if (error) {
    console.error('toggleGuideUseful insert error:', error)
    return { success: false, marked: false }
  }

  return { success: true, marked: true }
}

export async function submitGuideReport(
  guideSlug: string,
  visitorId: string,
  message: string
) {
  const supabase = await createClient()

  if (!message.trim()) {
    return { success: false, error: 'Descreva o problema encontrado.' }
  }
  if (message.length > 2000) {
    return { success: false, error: 'Mensagem muito longa.' }
  }

  const { error } = await supabase.from('guide_feedback').insert({
    guide_slug: guideSlug,
    visitor_id: visitorId,
    feedback_type: 'report',
    message: message.trim(),
  })

  if (error) {
    console.error('submitGuideReport error:', error)
    return { success: false, error: 'Erro ao enviar relatório.' }
  }

  return { success: true }
}
