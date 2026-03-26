'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type ActionResult = { success: true } | { success: false; error: string }

async function getAuthenticatedUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function confirmBooking(bookingId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser()

  // Verify the current user is the professional for this booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  if (booking.professional_id !== user.id) {
    return { success: false, error: 'Apenas o profissional pode confirmar este agendamento.' }
  }

  if (booking.status !== 'pending') {
    return { success: false, error: 'Este agendamento não está pendente.' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)

  if (error) {
    return { success: false, error: 'Erro ao confirmar agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser()

  // Both user and professional can cancel
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id, user_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  if (booking.user_id !== user.id && booking.professional_id !== user.id) {
    return { success: false, error: 'Você não tem permissão para cancelar este agendamento.' }
  }

  if (booking.status === 'cancelled' || booking.status === 'completed') {
    return { success: false, error: 'Este agendamento não pode ser cancelado.' }
  }

  const updateData: Record<string, string> = { status: 'cancelled' }
  if (reason) {
    updateData.cancellation_reason = reason
  }

  const { error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)

  if (error) {
    return { success: false, error: 'Erro ao cancelar agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function addSessionLink(bookingId: string, link: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser()

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

  if (booking.professional_id !== user.id) {
    return { success: false, error: 'Apenas o profissional pode adicionar o link da sessão.' }
  }

  if (booking.status !== 'confirmed' && booking.status !== 'pending') {
    return { success: false, error: 'Não é possível adicionar link a este agendamento.' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ session_link: link.trim() })
    .eq('id', bookingId)

  if (error) {
    return { success: false, error: 'Erro ao salvar o link. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}

export async function completeBooking(bookingId: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthenticatedUser()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, professional_id')
    .eq('id', bookingId)
    .single()

  if (!booking) {
    return { success: false, error: 'Agendamento não encontrado.' }
  }

  if (booking.professional_id !== user.id) {
    return { success: false, error: 'Apenas o profissional pode concluir este agendamento.' }
  }

  if (booking.status !== 'confirmed') {
    return { success: false, error: 'Apenas agendamentos confirmados podem ser concluídos.' }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)

  if (error) {
    return { success: false, error: 'Erro ao concluir agendamento. Tente novamente.' }
  }

  revalidatePath('/agenda')
  return { success: true }
}
