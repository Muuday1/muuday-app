import type { SupabaseClient } from '@supabase/supabase-js'

export async function getGuideUsefulCountService(supabase: SupabaseClient, guideSlug: string) {
  const { count, error } = await supabase
    .from('guide_feedback')
    .select('*', { count: 'exact', head: true })
    .eq('guide_slug', guideSlug)
    .eq('feedback_type', 'useful')

  if (error) {
    console.error('getGuideUsefulCount error:', error.message, error.code)
    return 0
  }
  return count || 0
}

export async function toggleGuideUsefulService(supabase: SupabaseClient, guideSlug: string, visitorId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('guide_feedback')
    .select('id')
    .eq('guide_slug', guideSlug)
    .eq('visitor_id', visitorId)
    .eq('feedback_type', 'useful')
    .maybeSingle()

  if (existingError) {
    console.error('[guide-feedback] existing query error:', existingError.message)
  }

  if (existing) {
    const { error } = await supabase
      .from('guide_feedback')
      .delete()
      .eq('id', existing.id)

    if (error) {
      console.error('toggleGuideUseful delete error:', error.message, error.code)
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
    console.error('toggleGuideUseful insert error:', error.message, error.code)
    return { success: false, marked: false }
  }

  return { success: true, marked: true }
}

export async function submitGuideReportService(
  supabase: SupabaseClient,
  guideSlug: string,
  visitorId: string,
  message: string,
) {
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
    console.error('submitGuideReport error:', error.message, error.code)
    return { success: false, error: 'Erro ao enviar relatório.' }
  }

  return { success: true }
}
