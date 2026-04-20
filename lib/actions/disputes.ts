'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'

const caseIdSchema = z.string().uuid('Identificador de caso inválido.')
const bookingIdSchema = z.string().uuid('Identificador de agendamento inválido.')
const reasonSchema = z.string().trim().min(10, 'Descreva o motivo com pelo menos 10 caracteres.').max(1000, 'Motivo muito longo.')
const contentSchema = z.string().trim().min(1, 'Mensagem não pode estar vazia.').max(2000, 'Mensagem muito longa.')

const caseTypeSchema = z.enum(['cancelation_dispute', 'no_show_claim', 'quality_issue', 'refund_request'])

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

/**
 * Open a new case/dispute.
 */
export async function openCase(
  bookingId: string,
  type: string,
  reason: string,
): Promise<DisputeResult<{ caseId: string }>> {
  const { supabase, userId } = await getAuthenticatedUser()

  const rl = await rateLimit('bookingManage', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const bookingParsed = bookingIdSchema.safeParse(bookingId)
  const typeParsed = caseTypeSchema.safeParse(type)
  const reasonParsed = reasonSchema.safeParse(reason)

  if (!bookingParsed.success) {
    return { success: false, error: bookingParsed.error.issues[0]?.message || 'Agendamento inválido.' }
  }
  if (!typeParsed.success) {
    return { success: false, error: 'Tipo de disputa inválido.' }
  }
  if (!reasonParsed.success) {
    return { success: false, error: reasonParsed.error.issues[0]?.message || 'Motivo inválido.' }
  }

  // Verify user is a participant in the booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id, professional_id')
    .eq('id', bookingParsed.data)
    .maybeSingle()

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  const isParticipant = booking.user_id === userId
  if (!isParticipant) {
    const { data: prof } = await supabase
      .from('professionals')
      .select('id')
      .eq('id', booking.professional_id)
      .eq('user_id', userId)
      .maybeSingle()
    if (!prof) {
      return { success: false, error: 'Você não tem acesso a este agendamento.' }
    }
  }

  const { data, error } = await supabase
    .from('cases')
    .insert({
      booking_id: bookingParsed.data,
      reporter_id: userId,
      type: typeParsed.data,
      reason: reasonParsed.data,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: 'Erro ao abrir disputa.' }
  }

  return { success: true, data: { caseId: data.id } }
}

/**
 * Add a message to a case.
 */
export async function addCaseMessage(
  caseId: string,
  content: string,
): Promise<DisputeResult<{ messageId: string }>> {
  const { supabase, userId } = await getAuthenticatedUser()

  const rl = await rateLimit('messageSend', userId)
  if (!rl.allowed) return { success: false, error: 'Muitas mensagens. Tente novamente em breve.' }

  const idParsed = caseIdSchema.safeParse(caseId)
  const contentParsed = contentSchema.safeParse(content)

  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }
  if (!contentParsed.success) {
    return { success: false, error: contentParsed.error.issues[0]?.message || 'Conteúdo inválido.' }
  }

  // Verify participant
  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, reporter_id')
    .eq('id', idParsed.data)
    .maybeSingle()

  if (!caseRow) {
    return { success: false, error: 'Caso não encontrado.' }
  }

  const isAdmin = await requireAdmin(supabase)
  const canParticipate = caseRow.reporter_id === userId || isAdmin.success
  if (!canParticipate) {
    return { success: false, error: 'Você não pode participar deste caso.' }
  }

  const { data, error } = await supabase
    .from('case_messages')
    .insert({
      case_id: idParsed.data,
      sender_id: userId,
      content: contentParsed.data,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: 'Erro ao enviar mensagem.' }
  }

  return { success: true, data: { messageId: data.id } }
}

/**
 * Resolve a case (admin only).
 */
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

  const idParsed = caseIdSchema.safeParse(caseId)
  const resolutionParsed = reasonSchema.safeParse(resolution)

  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }
  if (!resolutionParsed.success) {
    return { success: false, error: resolutionParsed.error.issues[0]?.message || 'Resolução inválida.' }
  }

  const resolvedAt = new Date().toISOString()

  const { error } = await supabase
    .from('cases')
    .update({
      status: 'resolved',
      resolution: resolutionParsed.data,
      refund_amount: refundAmount ?? null,
      resolved_at: resolvedAt,
      resolved_by: adminId,
    })
    .eq('id', idParsed.data)

  if (error) {
    return { success: false, error: 'Erro ao resolver caso.' }
  }

  // Log action
  await supabase.from('case_actions').insert({
    case_id: idParsed.data,
    action_type: 'resolved',
    performed_by: adminId,
    metadata: { refund_amount: refundAmount ?? null },
  })

  return { success: true, data: { resolvedAt } }
}

/**
 * Get a single case by ID.
 */
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

  const idParsed = caseIdSchema.safeParse(caseId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { data, error } = await supabase
    .from('cases')
    .select('id, booking_id, reporter_id, type, status, reason, resolution, refund_amount, resolved_at, created_at, profiles!cases_reporter_id_fkey(full_name)')
    .eq('id', idParsed.data)
    .maybeSingle()

  if (error || !data) {
    return { success: false, error: 'Caso não encontrado.' }
  }

  const isAdmin = await requireAdmin(supabase)
  const canAccess = data.reporter_id === userId || isAdmin.success
  if (!canAccess) {
    return { success: false, error: 'Você não tem acesso a este caso.' }
  }

  return {
    success: true,
    data: {
      ...data,
      reporter_name: (data as any).profiles?.full_name || null,
    } as any,
  }
}

/**
 * Get messages for a case.
 */
export async function getCaseMessages(
  caseId: string,
): Promise<DisputeResult<{ messages: unknown[] }>> {
  const { supabase, userId } = await getAuthenticatedUser()

  const idParsed = caseIdSchema.safeParse(caseId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, reporter_id')
    .eq('id', idParsed.data)
    .maybeSingle()

  if (!caseRow) {
    return { success: false, error: 'Caso não encontrado.' }
  }

  const isAdmin = await requireAdmin(supabase)
  const canAccess = caseRow.reporter_id === userId || isAdmin.success
  if (!canAccess) {
    return { success: false, error: 'Você não tem acesso a este caso.' }
  }

  const { data, error } = await supabase
    .from('case_messages')
    .select('id, sender_id, content, created_at, profiles!case_messages_sender_id_fkey(full_name)')
    .eq('case_id', idParsed.data)
    .order('created_at', { ascending: true })

  if (error) {
    return { success: false, error: 'Erro ao carregar mensagens.' }
  }

  return { success: true, data: { messages: data || [] } }
}

/**
 * List cases for admin or reporter.
 */
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

  let query = supabase
    .from('cases')
    .select('id, booking_id, reporter_id, type, status, reason, resolution, refund_amount, resolved_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (!isAdmin.success) {
    query = query.eq('reporter_id', userId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: 'Erro ao carregar casos.' }
  }

  const cases = data || []
  const hasMore = cases.length > limit
  const trimmed = hasMore ? cases.slice(0, limit) : cases
  const nextCursor = hasMore && trimmed.length > 0
    ? String(trimmed[trimmed.length - 1].created_at)
    : null

  return { success: true, data: { cases: trimmed, nextCursor } }
}
