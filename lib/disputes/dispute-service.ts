import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { processRefund } from '@/lib/payments/refund/engine'

const caseIdSchema = z.string().uuid('Identificador de caso inválido.')
const bookingIdSchema = z.string().uuid('Identificador de agendamento inválido.')
const reasonSchema = z.string().trim().min(10, 'Descreva o motivo com pelo menos 10 caracteres.').max(1000, 'Motivo muito longo.')
const contentSchema = z.string().trim().min(1, 'Mensagem não pode estar vazia.').max(2000, 'Mensagem muito longa.')

export const caseTypeSchema = z.enum([
  'cancelation_dispute',
  'no_show_claim',
  'quality_issue',
  'refund_request',
])

export type DisputeResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function openCase(
  supabase: SupabaseClient,
  userId: string,
  bookingId: string,
  type: string,
  reason: string,
): Promise<DisputeResult<{ caseId: string }>> {
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

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, professional_id')
    .eq('id', bookingParsed.data)
    .maybeSingle()

  if (bookingError) {
    console.error('[disputes] failed to load booking:', bookingError.message)
  }

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  const isParticipant = booking.user_id === userId
  if (!isParticipant) {
    const { data: prof, error: profError } = await supabase
      .from('professionals')
      .select('id')
      .eq('id', booking.professional_id)
      .eq('user_id', userId)
      .maybeSingle()
    if (profError) {
      console.error('[disputes] failed to load professional:', profError.message)
    }
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

export async function addCaseMessage(
  supabase: SupabaseClient,
  userId: string,
  caseId: string,
  content: string,
  isAdmin: boolean,
): Promise<DisputeResult<{ messageId: string }>> {
  const idParsed = caseIdSchema.safeParse(caseId)
  const contentParsed = contentSchema.safeParse(content)

  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }
  if (!contentParsed.success) {
    return { success: false, error: contentParsed.error.issues[0]?.message || 'Conteúdo inválido.' }
  }

  const { data: caseRow } = await supabase
    .from('cases')
    .select('id, reporter_id')
    .eq('id', idParsed.data)
    .maybeSingle()

  if (!caseRow) {
    return { success: false, error: 'Caso não encontrado.' }
  }

  const canParticipate = caseRow.reporter_id === userId || isAdmin
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

export async function resolveCase(
  supabase: SupabaseClient,
  adminId: string,
  caseId: string,
  resolution: string,
  refundAmount?: number,
): Promise<DisputeResult<{ resolvedAt: string; refundResult?: { refundId: string; amountRefunded: bigint } }>> {
  const idParsed = caseIdSchema.safeParse(caseId)
  const resolutionParsed = reasonSchema.safeParse(resolution)

  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }
  if (!resolutionParsed.success) {
    return { success: false, error: resolutionParsed.error.issues[0]?.message || 'Resolução inválida.' }
  }

  const resolvedAt = new Date().toISOString()

  // Load case to get booking_id
  const { data: caseRow } = await supabase
    .from('cases')
    .select('booking_id, type')
    .eq('id', idParsed.data)
    .maybeSingle()

  // ── Process refund if amount provided ──────────────────────────────
  let refundResult: { refundId: string; amountRefunded: bigint } | undefined
  if (refundAmount && refundAmount > 0 && caseRow?.booking_id) {
    const admin = createAdminClient()
    if (admin) {
      const result = await processRefund(admin, {
        bookingId: caseRow.booking_id,
        reason: resolutionParsed.data,
        percentage: refundAmount,
        adminId,
      })

      if (!result.success) {
        return {
          success: false,
          error: result.stripeError || 'Erro ao processar reembolso. Caso não foi resolvido.',
        }
      }

      refundResult = {
        refundId: result.refundId || 'unknown',
        amountRefunded: result.amountRefunded || BigInt(0),
      }

      // Update associated dispute_resolution if exists
      const { data: disputeResolution } = await admin
        .from('dispute_resolutions')
        .select('id')
        .eq('booking_id', caseRow.booking_id)
        .eq('status', 'open')
        .maybeSingle()

      if (disputeResolution) {
        await admin
          .from('dispute_resolutions')
          .update({
            status: 'recovered',
            recovered_amount: result.amountRefunded,
            remaining_debt: BigInt(0),
            resolved_at: resolvedAt,
            updated_at: resolvedAt,
          })
          .eq('id', disputeResolution.id)
      }
    }
  }

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

  const { error: actionError } = await supabase.from('case_actions').insert({
    case_id: idParsed.data,
    action_type: 'resolved',
    performed_by: adminId,
    metadata: {
      refund_amount: refundAmount ?? null,
      refund_id: refundResult?.refundId,
      refunded_amount_minor: refundResult?.amountRefunded.toString(),
    },
  })
  if (actionError) {
    console.error('[disputes] case_actions insert error:', actionError.message)
  }

  return {
    success: true,
    data: {
      resolvedAt,
      refundResult: refundResult
        ? { refundId: refundResult.refundId, amountRefunded: refundResult.amountRefunded }
        : undefined,
    },
  }
}

export async function getCaseById(
  supabase: SupabaseClient,
  userId: string,
  caseId: string,
  isAdmin: boolean,
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

  const canAccess = data.reporter_id === userId || isAdmin
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

export async function getCaseMessages(
  supabase: SupabaseClient,
  userId: string,
  caseId: string,
  isAdmin: boolean,
): Promise<DisputeResult<{ messages: unknown[] }>> {
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

  const canAccess = caseRow.reporter_id === userId || isAdmin
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

export async function listCases(
  supabase: SupabaseClient,
  userId: string,
  isAdmin: boolean,
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
  let query = supabase
    .from('cases')
    .select('id, booking_id, reporter_id, type, status, reason, resolution, refund_amount, resolved_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (!isAdmin) {
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
