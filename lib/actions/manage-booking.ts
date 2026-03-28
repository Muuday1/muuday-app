'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type ActionResult = { success: true } | { success: false; error: string }

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
  const { supabase, adminSupabase, professionalId } = await getAuthenticatedContext()

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode confirmar este agendamento.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode confirmar este agendamento.' }
  }

  if (booking.status !== 'pending') {
    return { success: false, error: 'Este agendamento não está pendente.' }
  }

  let { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)
    .eq('professional_id', professionalId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()

  if ((!updatedBooking || error) && adminSupabase) {
    ;({ data: updatedBooking, error } = await adminSupabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
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
  const { supabase, adminSupabase, user, professionalId } = await getAuthenticatedContext()

  // Both user and assigned professional can cancel
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, user_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  const isBookingUser = booking.user_id === user.id
  const isBookingProfessional = professionalId ? booking.professional_id === professionalId : false

  if (!isBookingUser && !isBookingProfessional) {
    return { success: false, error: 'Você não tem permissão para cancelar este agendamento.' }
  }

  if (booking.status === 'cancelled' || booking.status === 'completed') {
    return { success: false, error: 'Este agendamento não pode ser cancelado.' }
  }

  const updateData: Record<string, string> = { status: 'cancelled' }
  if (reason) {
    updateData.cancellation_reason = reason
  }

  let cancelQuery = supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .in('status', ['pending', 'confirmed'])

  if (isBookingUser) {
    cancelQuery = cancelQuery.eq('user_id', user.id)
  } else if (professionalId) {
    cancelQuery = cancelQuery.eq('professional_id', professionalId)
  }

  let { data: cancelledBooking, error } = await cancelQuery
    .select('id')
    .maybeSingle()

  if ((!cancelledBooking || error) && adminSupabase) {
    let adminCancelQuery = adminSupabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .in('status', ['pending', 'confirmed'])

    if (isBookingUser) {
      adminCancelQuery = adminCancelQuery.eq('user_id', user.id)
    } else if (professionalId) {
      adminCancelQuery = adminCancelQuery.eq('professional_id', professionalId)
    }

    ;({ data: cancelledBooking, error } = await adminCancelQuery
      .select('id')
      .maybeSingle())
  }

  if (error || !cancelledBooking) {
    return { success: false, error: 'Erro ao cancelar agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function addSessionLink(bookingId: string, link: string): Promise<ActionResult> {
  const { supabase, adminSupabase, professionalId } = await getAuthenticatedContext()

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode adicionar o link da sessão.' }
  }

  if (!link || !link.trim()) {
    return { success: false, error: 'O link da sessão é obrigatório.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode adicionar o link da sessão.' }
  }

  if (booking.status !== 'confirmed' && booking.status !== 'pending') {
    return { success: false, error: 'Não é possível adicionar link a este agendamento.' }
  }

  let { data: updatedBooking, error } = await supabase
    .from('bookings')
    .update({ session_link: link.trim() })
    .eq('id', bookingId)
    .eq('professional_id', professionalId)
    .in('status', ['pending', 'confirmed'])
    .select('id')
    .maybeSingle()

  if ((!updatedBooking || error) && adminSupabase) {
    ;({ data: updatedBooking, error } = await adminSupabase
      .from('bookings')
      .update({ session_link: link.trim() })
      .eq('id', bookingId)
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
  const { supabase, adminSupabase, professionalId } = await getAuthenticatedContext()

  if (!professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  if (booking.professional_id !== professionalId) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Apenas agendamentos confirmados podem ser concluídos.' }
  }

  let { data: completedBooking, error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)
    .eq('professional_id', professionalId)
    .eq('status', 'confirmed')
    .select('id')
    .maybeSingle()

  if ((!completedBooking || error) && adminSupabase) {
    ;({ data: completedBooking, error } = await adminSupabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', bookingId)
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

