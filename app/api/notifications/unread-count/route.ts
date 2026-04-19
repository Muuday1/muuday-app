import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/notifications/unread-count
 * Returns the unread notification count for the authenticated user.
 * Designed for polling from the frontend badge indicator.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401 })
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) {
    return NextResponse.json({ error: 'Failed to count notifications' }, { status: 500 })
  }

  return NextResponse.json({ count: count ?? 0 })
}
