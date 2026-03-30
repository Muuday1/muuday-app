import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the most recently created professional profile for a given user.
 * This avoids runtime errors when legacy/seed data contains multiple rows.
 */
export async function getPrimaryProfessionalForUser(
  supabase: SupabaseClient,
  userId: string,
  columns = '*',
) : Promise<{ data: Record<string, any> | null; error: any }> {
  let { data, error } = await (supabase
    .from('professionals')
    .select(columns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1) as any)

  if (error) {
    const fallback = await (supabase
      .from('professionals')
      .select(columns)
      .eq('user_id', userId)
      .limit(1) as any)
    data = fallback.data
    error = fallback.error
  }

  if (error) return { data: null, error }
  return {
    data: Array.isArray(data) && data.length > 0 ? (data[0] as Record<string, any>) : null,
    error: null,
  }
}
