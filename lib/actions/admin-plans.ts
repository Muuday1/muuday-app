'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin/auth-helper'
import { loadPlanConfigMap, type PlanConfigMap } from '@/lib/plan-config'
import {
  loadPlanConfigsService,
  savePlanConfigsService,
} from '@/lib/admin/plan-config-service'

export type { PlanConfigMap }

export async function loadPlanConfigs() {
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (!adminCheck) {
    return { ok: false as const, error: 'Acesso restrito ao admin.' }
  }

  return loadPlanConfigsService(supabase)
}

export async function savePlanConfigs(plans: PlanConfigMap) {
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (!adminCheck) {
    return { ok: false as const, error: 'Acesso restrito ao admin.' }
  }

  return savePlanConfigsService(supabase, adminCheck.userId, plans)
}
