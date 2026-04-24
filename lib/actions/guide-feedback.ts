'use server'

import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  getGuideUsefulCountService,
  toggleGuideUsefulService,
  submitGuideReportService,
} from '@/lib/guides/guide-feedback-service'

export async function getGuideUsefulCount(guideSlug: string) {
  const supabase = await createClient()
  return getGuideUsefulCountService(supabase, guideSlug)
}

export async function toggleGuideUseful(guideSlug: string, visitorId: string) {
  const supabase = await createClient()

  const rl = await rateLimit('messageSend', `guide-useful-${visitorId.slice(0, 32)}`)
  if (!rl.allowed) return { success: false, marked: false, error: 'Muitas ações. Tente novamente em breve.' }

  return toggleGuideUsefulService(supabase, guideSlug, visitorId)
}

export async function submitGuideReport(
  guideSlug: string,
  visitorId: string,
  message: string,
) {
  const supabase = await createClient()

  const rl = await rateLimit('messageSend', `guide-report-${visitorId.slice(0, 32)}`)
  if (!rl.allowed) return { success: false, error: 'Muitos relatórios. Tente novamente em breve.' }

  return submitGuideReportService(supabase, guideSlug, visitorId, message)
}
