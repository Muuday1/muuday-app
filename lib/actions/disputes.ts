'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import {
  openCase as openCaseService,
  addCaseMessage as addCaseMessageService,
  resolveCase as resolveCaseService,
  getCaseById as getCaseByIdService,
  getCaseMessages as getCaseMessagesService,
  listCases as listCasesService,
  assignCase as assignCaseService,
  updateCaseStatus as updateCaseStatusService,
  getCaseEvidence as getCaseEvidenceService,
  getCaseTimeline as getCaseTimelineService,
  autoCreateCase as autoCreateCaseService,
} from '@/lib/disputes/dispute-service'

export type DisputeResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Acesso restrito a administradores.' } as const
  }

  return { success: true, userId: user.id } as const
}

export async function openCase(
  bookingId: string,
  type: string,
  reason: string,
): Promise<DisputeResult<{ caseId: string }>> {
  const { supabase, userId } = await getAuthenticatedUser()

  const rl = await rateLimit('bookingManage', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  return openCaseService(supabase, userId, bookingId, type, reason)
}

export async function addCaseMessage(
  caseId: string,
  content: string,
): Promise<DisputeResult<{ messageId: string }>> {
  const { supabase, userId } = await getAuthenticatedUser()

  const rl = await rateLimit('messageSend', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas mensagens. Tente novamente em breve.' }

  const isAdmin = await requireAdmin(supabase)
  return addCaseMessageService(supabase, userId, caseId, content, isAdmin.success)
}

export async function resolveCase(
  caseId: string,
  resolution: string,
  refundAmount?: number,
): Promise<DisputeResult<{ resolvedAt: string }>> {
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (!adminCheck.success) {
    return { success: false, error: adminCheck.error }
  }
  const adminId = adminCheck.userId

  const rl = await rateLimit('bookingManage', adminId)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  return resolveCaseService(supabase, adminId, caseId, resolution, refundAmount)
}

export async function getCaseById(
  caseId: string,
): Promise<DisputeResult<{
  id: string
  booking_id: string
  reporter_id: string
  type: string
  status: string
  reason: string
  resolution: string | null
  refund_amount: number | null
  resolved_at: string | null
  created_at: string
  reporter_name: string | null
}>> {
  const { supabase, userId } = await getAuthenticatedUser()
  const isAdmin = await requireAdmin(supabase)
  return getCaseByIdService(supabase, userId, caseId, isAdmin.success)
}

export async function getCaseMessages(
  caseId: string,
): Promise<DisputeResult<{ messages: unknown[] }>> {
  const { supabase, userId } = await getAuthenticatedUser()
  const isAdmin = await requireAdmin(supabase)
  return getCaseMessagesService(supabase, userId, caseId, isAdmin.success)
}

export async function listCases(
  {
    status,
    type,
    priority,
    assignedTo,
    limit = 50,
    cursor,
  }: {
    status?: string
    type?: string
    priority?: string
    assignedTo?: string
    limit?: number
    cursor?: string
  } = {},
): Promise<DisputeResult<{ cases: unknown[]; nextCursor: string | null }>> {
  const { supabase, userId } = await getAuthenticatedUser()

  const rl = await rateLimit('bookingManage', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }

  const isAdmin = await requireAdmin(supabase)
  return listCasesService(supabase, userId, isAdmin.success, { status, type, priority, assignedTo, limit, cursor })
}

export async function assignCase(
  caseId: string,
  assigneeId: string | null,
): Promise<DisputeResult<{ assignedTo: string | null }>> {
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (!adminCheck.success) {
    return { success: false, error: adminCheck.error }
  }

  const rl = await rateLimit('bookingManage', adminCheck.userId)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  return assignCaseService(supabase, adminCheck.userId, caseId, assigneeId)
}

export async function updateCaseStatus(
  caseId: string,
  newStatus: string,
): Promise<DisputeResult<{ status: string }>> {
  const supabase = await createClient()
  const adminCheck = await requireAdmin(supabase)
  if (!adminCheck.success) {
    return { success: false, error: adminCheck.error }
  }

  const rl = await rateLimit('bookingManage', adminCheck.userId)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  return updateCaseStatusService(supabase, adminCheck.userId, caseId, newStatus)
}

export async function getCaseEvidence(
  caseId: string,
): Promise<DisputeResult<{
  booking: { id: string; scheduled_at: string; status: string; price_brl: number; session_type: string; user_id: string; professional_id: string } | null
  payment: { id: string; status: string; amount_brl: number; stripe_payment_intent_id: string | null } | null
  reporter: { full_name: string | null; email: string | null } | null
  professional: { full_name: string | null; email: string | null } | null
  user: { full_name: string | null; email: string | null } | null
}>> {
  const { supabase, userId } = await getAuthenticatedUser()
  const isAdmin = await requireAdmin(supabase)
  return getCaseEvidenceService(supabase, caseId)
}

export async function getCaseTimeline(
  caseId: string,
): Promise<DisputeResult<{ events: unknown[] }>> {
  const { supabase, userId } = await getAuthenticatedUser()
  const isAdmin = await requireAdmin(supabase)
  return getCaseTimelineService(supabase, caseId)
}

export async function autoCreateCase(
  bookingId: string,
  type: string,
  reason: string,
): Promise<DisputeResult<{ caseId: string }>> {
  const { supabase, userId } = await getAuthenticatedUser()

  const rl = await rateLimit('bookingManage', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  return autoCreateCaseService(supabase, bookingId, type as any, reason, userId)
}
