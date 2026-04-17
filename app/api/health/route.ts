import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks: Record<string, 'ok' | 'fail' | 'unknown'> = {
    app: 'ok',
    supabase_auth: 'unknown',
    supabase_db: 'unknown',
  }

  let status = 200

  try {
    const supabase = createClient()
    const { error: authError } = await supabase.auth.getSession()
    checks.supabase_auth = authError ? 'fail' : 'ok'

    const { error: dbError } = await supabase.from('categories').select('id', { count: 'exact', head: true })
    // A permissions error (RLS blocking) still means the DB is reachable
    checks.supabase_db = dbError && dbError.code !== '42501' ? 'fail' : 'ok'
  } catch {
    checks.supabase_auth = 'fail'
    checks.supabase_db = 'fail'
    status = 503
  }

  const allOk = Object.values(checks).every((v) => v === 'ok')
  if (!allOk) {
    status = 503
  }

  return NextResponse.json(
    {
      ok: allOk,
      service: 'muuday-app',
      checks,
      at: new Date().toISOString(),
    },
    { status },
  )
}
