import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Lightweight runtime RLS sanity check.
 * Uses the unauthenticated server client (no user cookie) to verify
 * that sensitive tables are not world-readable.
 */
export async function GET() {
  const supabase = createClient()
  const checks: Record<string, 'ok' | 'fail' | 'unknown'> = {}

  // bookings: anon/unauthenticated reads should return zero rows or be blocked
  const bookings = await supabase.from('bookings').select('id', { count: 'exact', head: true })
  checks.bookings = bookings.error?.code === '42501' || (bookings.count ?? 0) === 0 ? 'ok' : 'fail'

  // payments: same expectation
  const payments = await supabase.from('payments').select('id', { count: 'exact', head: true })
  checks.payments = payments.error?.code === '42501' || (payments.count ?? 0) === 0 ? 'ok' : 'fail'

  // request_bookings: same expectation
  const requestBookings = await supabase.from('request_bookings').select('id', { count: 'exact', head: true })
  checks.request_bookings =
    requestBookings.error?.code === '42501' || (requestBookings.count ?? 0) === 0 ? 'ok' : 'fail'

  // messages (if table exists): same expectation
  const messages = await supabase.from('messages').select('id', { count: 'exact', head: true })
  checks.messages = messages.error?.code === '42501' || messages.error?.code === '42P01' || (messages.count ?? 0) === 0 ? 'ok' : 'fail'

  const allOk = Object.values(checks).every((v) => v === 'ok')

  return NextResponse.json(
    {
      ok: allOk,
      service: 'muuday-app',
      checks,
      at: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 },
    )
}
