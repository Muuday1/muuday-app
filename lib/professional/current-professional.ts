import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { ProfessionalRow } from '@/types'

export type { ProfessionalRow }

/**
 * Returns the most recently created professional profile for a given user.
 * This avoids runtime errors when legacy/seed data contains multiple rows.
 *
 * The function is generic so callers can opt into type safety by specifying
 * the expected shape. The default remains Record<string,any> for backward
 * compatibility with existing callers that select partial columns.
 *
 * @example
 * // Full row, typed
 * const { data } = await getPrimaryProfessionalForUser<ProfessionalRow>(supabase, userId)
 *
 * @example
 * // Partial columns, caller-defined shape
 * const { data } = await getPrimaryProfessionalForUser<{ id: string; tier: string }>(
 *   supabase, userId, 'id, tier'
 * )
 */
export async function getPrimaryProfessionalForUser<T = Record<string, any>>(
  supabase: SupabaseClient,
  userId: string,
  columns = '*',
): Promise<{ data: T | null; error: PostgrestError | null }> {
  let { data, error } = await supabase
    .from('professionals')
    .select(columns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    const fallback = await supabase
      .from('professionals')
      .select(columns)
      .eq('user_id', userId)
      .limit(1)
    data = fallback.data
    error = fallback.error
  }

  if (error) return { data: null, error }
  return {
    data: Array.isArray(data) && data.length > 0 ? (data[0] as T) : null,
    error: null,
  }
}
