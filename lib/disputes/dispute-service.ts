import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
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
    Sentry.captureException(bookingError, { tags: { area: 'disputes', action: 'load-booking' } })
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
      Sentry.captureException(profError, { tags: { area: 'disputes', action: 'load-professional' } })
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
    Sentry.captureException(actionError, { tags: { area: 'disputes', action: 'insert-case-action' } })
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
  assigned_to: string | null
  priority: string
  sla_deadline: string | null
  summary: string | null
  reporter_name: string | null
}>> {
  const idParsed = caseIdSchema.safeParse(caseId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { data, error } = await supabase
    .from('cases')
    .select('id, booking_id, reporter_id, type, status, reason, resolution, refund_amount, resolved_at, created_at, assigned_to, priority, sla_deadline, summary, profiles!cases_reporter_id_fkey(full_name)')
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
      reporter_name: (data as unknown as { profiles?: { full_name: string | null } }).profiles?.full_name || null,
    },
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
    .limit(200)

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
  let query = supabase
    .from('cases')
    .select('id, booking_id, reporter_id, type, status, reason, resolution, refund_amount, resolved_at, created_at, updated_at, assigned_to, priority, sla_deadline, summary, profiles!cases_reporter_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (!isAdmin) {
    query = query.eq('reporter_id', userId)
  }

  if (status) {
    query = query.eq('status', status)
  }
  if (type) {
    query = query.eq('type', type)
  }
  if (priority) {
    query = query.eq('priority', priority)
  }
  if (assignedTo === 'me') {
    query = query.eq('assigned_to', userId)
  } else if (assignedTo === 'unassigned') {
    query = query.is('assigned_to', null)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    Sentry.captureException(error, { tags: { area: 'disputes', action: 'list-cases' } })
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

// ---------------------------------------------------------------------------
// Case Assignment
// ---------------------------------------------------------------------------

export async function assignCase(
  supabase: SupabaseClient,
  adminId: string,
  caseId: string,
  assigneeId: string | null,
): Promise<DisputeResult<{ assignedTo: string | null }>> {
  const idParsed = caseIdSchema.safeParse(caseId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { error } = await supabase
    .from('cases')
    .update({ assigned_to: assigneeId })
    .eq('id', idParsed.data)

  if (error) {
    Sentry.captureException(error, { tags: { area: 'disputes', action: 'assign-case' } })
    return { success: false, error: 'Erro ao atribuir caso.' }
  }

  // Record action
  await supabase.from('case_actions').insert({
    case_id: idParsed.data,
    action_type: assigneeId ? 'assigned' : 'unassigned',
    performed_by: adminId,
    metadata: { assignee_id: assigneeId },
  })

  return { success: true, data: { assignedTo: assigneeId } }
}

// ---------------------------------------------------------------------------
// Case Status Transition
// ---------------------------------------------------------------------------

const validStatusTransitions: Record<string, string[]> = {
  open: ['under_review', 'waiting_info', 'resolved', 'closed'],
  under_review: ['waiting_info', 'resolved', 'closed'],
  waiting_info: ['under_review', 'resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
}

export async function updateCaseStatus(
  supabase: SupabaseClient,
  adminId: string,
  caseId: string,
  newStatus: string,
): Promise<DisputeResult<{ status: string }>> {
  const idParsed = caseIdSchema.safeParse(caseId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  // Load current status
  const { data: caseRow } = await supabase
    .from('cases')
    .select('status')
    .eq('id', idParsed.data)
    .maybeSingle()

  if (!caseRow) {
    return { success: false, error: 'Caso não encontrado.' }
  }

  const allowed = validStatusTransitions[caseRow.status] || []
  if (!allowed.includes(newStatus)) {
    return { success: false, error: `Transição inválida: ${caseRow.status} → ${newStatus}.` }
  }

  const { error } = await supabase
    .from('cases')
    .update({ status: newStatus })
    .eq('id', idParsed.data)

  if (error) {
    Sentry.captureException(error, { tags: { area: 'disputes', action: 'update-case-status' } })
    return { success: false, error: 'Erro ao atualizar status do caso.' }
  }

  await supabase.from('case_actions').insert({
    case_id: idParsed.data,
    action_type: 'status_changed',
    performed_by: adminId,
    metadata: { from_status: caseRow.status, to_status: newStatus },
  })

  return { success: true, data: { status: newStatus } }
}

// ---------------------------------------------------------------------------
// Case Evidence (auto-collected)
// ---------------------------------------------------------------------------

export interface CaseEvidence {
  booking: {
    id: string
    scheduled_at: string
    status: string
    price_brl: number
    session_type: string
    user_id: string
    professional_id: string
  } | null
  payment: {
    id: string
    status: string
    amount_brl: number
    stripe_payment_intent_id: string | null
  } | null
  reporter: { full_name: string | null; email: string | null } | null
  professional: { full_name: string | null; email: string | null } | null
  user: { full_name: string | null; email: string | null } | null
}

export async function getCaseEvidence(
  supabase: SupabaseClient,
  caseId: string,
): Promise<DisputeResult<CaseEvidence>> {
  const idParsed = caseIdSchema.safeParse(caseId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { data: caseRow } = await supabase
    .from('cases')
    .select('booking_id, reporter_id')
    .eq('id', idParsed.data)
    .maybeSingle()

  if (!caseRow) {
    return { success: false, error: 'Caso não encontrado.' }
  }

  // Load booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, scheduled_at, status, price_brl, session_type, user_id, professional_id')
    .eq('id', caseRow.booking_id)
    .maybeSingle()

  // Load payment
  const { data: payment } = booking
    ? await supabase
        .from('payments')
        .select('id, status, amount_brl, stripe_payment_intent_id')
        .eq('booking_id', booking.id)
        .maybeSingle()
    : { data: null }

  // Load profiles
  const { data: reporter } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', caseRow.reporter_id)
    .maybeSingle()

  const { data: professional } = booking?.professional_id
    ? await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', booking.professional_id)
        .maybeSingle()
    : { data: null }

  const { data: user } = booking?.user_id
    ? await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', booking.user_id)
        .maybeSingle()
    : { data: null }

  return {
    success: true,
    data: {
      booking: booking || null,
      payment: payment || null,
      reporter: reporter || null,
      professional: professional || null,
      user: user || null,
    },
  }
}

// ---------------------------------------------------------------------------
// Case Timeline (actions + messages)
// ---------------------------------------------------------------------------

export async function getCaseTimeline(
  supabase: SupabaseClient,
  caseId: string,
): Promise<DisputeResult<{ events: unknown[] }>> {
  const idParsed = caseIdSchema.safeParse(caseId)
  if (!idParsed.success) {
    return { success: false, error: idParsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { data: actions, error: actionsError } = await supabase
    .from('case_actions')
    .select('id, action_type, performed_by, metadata, created_at, profiles!case_actions_performed_by_fkey(full_name)')
    .eq('case_id', idParsed.data)
    .order('created_at', { ascending: true })
    .limit(200)

  const { data: messages, error: messagesError } = await supabase
    .from('case_messages')
    .select('id, sender_id, content, created_at, profiles!case_messages_sender_id_fkey(full_name)')
    .eq('case_id', idParsed.data)
    .order('created_at', { ascending: true })
    .limit(200)

  if (actionsError || messagesError) {
    Sentry.captureException(actionsError || messagesError || new Error('getCaseTimeline failed'), { tags: { area: 'disputes', action: 'get-case-timeline' } })
    return { success: false, error: 'Erro ao carregar timeline.' }
  }

  const events = [
    ...(actions || []).map(a => ({ ...a, event_type: 'action' as const })),
    ...(messages || []).map(m => ({ ...m, event_type: 'message' as const })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return { success: true, data: { events } }
}

// ---------------------------------------------------------------------------
// Auto-create case (for system triggers like no-show)
// ---------------------------------------------------------------------------

export async function autoCreateCase(
  supabase: SupabaseClient,
  bookingId: string,
  type: 'no_show_claim' | 'cancelation_dispute' | 'quality_issue' | 'refund_request',
  reason: string,
  reporterId: string,
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

  // Check for duplicate open case
  const { data: existing } = await supabase
    .from('cases')
    .select('id')
    .eq('booking_id', bookingParsed.data)
    .eq('type', typeParsed.data)
    .in('status', ['open', 'under_review', 'waiting_info'])
    .maybeSingle()

  if (existing) {
    return { success: true, data: { caseId: existing.id } }
  }

  const priority = type === 'cancelation_dispute' ? 'P0' : 'P1'
  const slaHours = type === 'cancelation_dispute' ? 24 : type === 'no_show_claim' ? 24 : 48
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('cases')
    .insert({
      booking_id: bookingParsed.data,
      reporter_id: reporterId,
      type: typeParsed.data,
      reason: reasonParsed.data,
      priority,
      sla_deadline: slaDeadline,
      summary: reasonParsed.data.slice(0, 200),
    })
    .select('id')
    .single()

  if (error || !data) {
    Sentry.captureException(error || new Error('autoCreateCase failed'), { tags: { area: 'disputes', action: 'auto-create-case' } })
    return { success: false, error: 'Erro ao criar caso automaticamente.' }
  }

  return { success: true, data: { caseId: data.id } }
}
