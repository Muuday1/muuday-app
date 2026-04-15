import { NextResponse } from 'next/server'
import { loadPlanConfigMap } from '@/lib/plan-config'

export async function GET() {
  const plans = await loadPlanConfigMap()
  return NextResponse.json({ ok: true, plans })
}

