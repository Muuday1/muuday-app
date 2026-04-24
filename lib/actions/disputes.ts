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
    limit = 50,
    cursor,
  }: {
    status?: string
    limit?: number
    cursor?: string
  } = {},
): Promise<DisputeResult<{ cases: unknown[]; nextCursor: string | null }>> {
  const { supabase, userId } = await getAuthenticatedUser()

  const rl = await rateLimit('bookingManage', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }

  const isAdmin = await requireAdmin(supabase)
  return listCasesService(supabase, userId, isAdmin.success, { status, limit, cursor })
}
