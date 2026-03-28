'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type ActionResult = { success: true } | { success: false; error: string }

const bookingIdSchema = z.string().uuid('Identificador de agendamento invalido.')
const cancelReasonSchema = z
  .string()
  .trim()
  .max(300, 'Motivo de cancelamento muito longo.')
const sessionLinkSchema = z
  .string()
  .trim()
  .url('Link da sessao invalido.')
  .max(500, 'Link da sessao muito longo.')

function validateBookingId(bookingId: string): { ok: true; id: string } | { ok: false; result: ActionResult } {
  const parsed = bookingIdSchema.safeParse(bookingId)
  if (!parsed.success) {
    return {
      ok: false,
      result: { success: false, error: parsed.error.issues[0]?.message || 'Identificador invalido.' },
    }
  }
  return { ok: true, id: parsed.data }
}

async function getAuthenticatedContext() {
  const supabase = createClient()
  const adminSupabase = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return { supabase, adminSupabase, user, professionalId: professional?.id ?? null }
}

export async function confirmBooking(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, adminSupabase, professionalId } = await getAuthenticatedContext()

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode confirmar este agendamento.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', safeBookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento nao encontrado.' }
  }

  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode confirmar este agendamento.' }
  }

  if (booking.status !== 'pending') {
    return { success: false, error: 'Este agendamento nao esta pendente.' }
  }

  let { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if ((!updatedBooking || error) && adminSupabase) {
    ;({ data: updatedBooking, error } = await adminSupabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', safeBookingId)
      .eq('professional_id', professionalId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle())
  }

  if (error || !updatedBooking) {
    return { success: false, error: 'Erro ao confirmar agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  let normalizedReason: string | undefined
  if (typeof reason === 'string' && reason.trim()) {
    const parsedReason = cancelReasonSchema.safeParse(reason)
    if (!parsedReason.success) {
      return {
        success: false,
        error: parsedReason.error.issues[0]?.message || 'Motivo de cancelamento invalido.',
      }
    }
    normalizedReason = parsedReason.data
  }

  const { supabase, adminSupabase, user, professionalId } = await getAuthenticatedContext()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, user_id')
    .eq('id', safeBookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento nao encontrado.' }
  }

  const isBookingUser = booking.user_id === user.id
  const isBookingProfessional = professionalId ? booking.professional_id === professionalId : false

  if (!isBookingUser && !isBookingProfessional) {
    return { success: false, error: 'Voce nao tem permissao para cancelar este agendamento.' }
  }

  if (booking.status === 'cancelled' || booking.status === 'completed') {
    return { success: false, error: 'Este agendamento nao pode ser cancelado.' }
  }

  const updateData: Record<string, string> = { status: 'cancelled' }
  if (normalizedReason) {
    updateData.cancellation_reason = normalizedReason
  }

  let cancelQuery = supabase
    .from('bookings')
    .update(updateData)
    .eq('id', safeBookingId)
    .in('status', ['pending', 'confirmed'])

  if (isBookingUser) {
    cancelQuery = cancelQuery.eq('user_id', user.id)
  } else if (professionalId) {
    cancelQuery = cancelQuery.eq('professional_id', professionalId)
  }

  let { data: cancelledBooking, error } = await cancelQuery.select('id').maybeSingle()

  if ((!cancelledBooking || error) && adminSupabase) {
    let adminCancelQuery = adminSupabase
      .from('bookings')
      .update(updateData)
      .eq('id', safeBookingId)
      .in('status', ['pending', 'confirmed'])

    if (isBookingUser) {
      adminCancelQuery = adminCancelQuery.eq('user_id', user.id)
    } else if (professionalId) {
      adminCancelQuery = adminCancelQuery.eq('professional_id', professionalId)
    }

    ;({ data: cancelledBooking, error } = await adminCancelQuery.select('id').maybeSingle())
  }

  if (error || !cancelledBooking) {
    return { success: false, error: 'Erro ao cancelar agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function addSessionLink(bookingId: string, link: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const parsedLink = sessionLinkSchema.safeParse(link)
  if (!parsedLink.success) {
    return { success: false, error: parsedLink.error.issues[0]?.message || 'Link da sessao invalido.' }
  }

  const { supabase, adminSupabase, professionalId } = await getAuthenticatedContext()

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode adicionar o link da sessao.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', safeBookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento nao encontrado.' }
  }

  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode adicionar o link da sessao.' }
  }

  if (booking.status !== 'confirmed' && booking.status !== 'pending') {
    return { success: false, error: 'Nao e possivel adicionar link a este agendamento.' }
  }

  let { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ session_link: parsedLink.data })
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'confirmed'])
    .select('id')
    .maybeSingle()

  if ((!updatedBooking || error) && adminSupabase) {
    ;({ data: updatedBooking, error } = await adminSupabase
      .from('bookings')
      .update({ session_link: parsedLink.data })
      .eq('id', safeBookingId)
      .eq('professional_id', professionalId)
      .in('status', ['pending', 'confirmed'])
      .select('id')
      .maybeSingle())
  }

  if (error || !updatedBooking) {
    return { success: false, error: 'Erro ao salvar o link. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function completeBooking(bookingId: string): Promise<ActionResult> {
  const bookingIdValidation = validateBookingId(bookingId)
  if (!bookingIdValidation.ok) return bookingIdValidation.result
  const safeBookingId = bookingIdValidation.id

  const { supabase, adminSupabase, professionalId } = await getAuthenticatedContext()

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', safeBookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento nao encontrado.' }
  }

  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Apenas agendamentos confirmados podem ser concluidos.' }
  }

  let { data: completedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', safeBookingId)
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()

  if ((!completedBooking || error) && adminSupabase) {
    ;({ data: completedBooking, error } = await adminSupabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', safeBookingId)
      .eq('professional_id', professionalId)
      .eq('status', 'confirmed')
      .select('id')
      .maybeSingle())
  }

  if (error || !completedBooking) {
    return { success: false, error: 'Erro ao concluir agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}
