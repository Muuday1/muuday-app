import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

export async function hasExternalBusyConflict(
  supabase: SupabaseClient,
  professionalId: string,
  startUtcIso: string,
  endUtcIso: string,
) {
  const { count, error } = await supabase
    .from('external_calendar_busy_slots')
    .select('id', { count: 'exact', head: true })
    .eq('professional_id', professionalId)
    .lt('start_time_utc', endUtcIso)
    .gt('end_time_utc', startUtcIso)

  if (error) {
    Sentry.captureException(error, {
      tags: { area: 'external_calendar_conflicts' },
      extra: { professionalId, startUtcIso, endUtcIso },
    })
    return false
  }

  return (count || 0) > 0
}
