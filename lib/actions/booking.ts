'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const createBookingSchema = z.object({
  professionalId: z.string().uuid('Identificador de profissional invalido.'),
  scheduledAt: z
    .string()
    .min(16, 'Horario invalido.')
    .max(50, 'Horario invalido.')
    .refine(value => !Number.isNaN(new Date(value).getTime()), 'Horario invalido.'),
  notes: z.string().trim().max(500, 'Observacoes muito longas.').optional(),
})

export async function createBooking(data: {
  professionalId: string
  scheduledAt: string
  notes?: string
}): Promise<{ success: true; bookingId: string } | { success: false; error: string }> {
  const parsedInput = createBookingSchema.safeParse(data)
  if (!parsedInput.success) {
    const firstError = parsedInput.error.issues[0]?.message || 'Dados invalidos para agendamento.'
    return { success: false, error: firstError }
  }

  const bookingInput = parsedInput.data

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('currency, timezone')
    .eq('id', user.id)
    .single()

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, user_id, session_price_brl, session_duration_minutes, status')
    .eq('id', bookingInput.professionalId)
    .single()

  if (!professional || professional.status !== 'approved') {
    return { success: false, error: 'Profissional nao disponivel.' }
  }

  if (professional.user_id === user.id) {
    return { success: false, error: 'Nao e permitido agendar sessao com seu proprio perfil.' }
  }

  const durationMinutes = professional.session_duration_minutes
  const priceBrl = professional.session_price_brl

  const scheduledDate = new Date(bookingInput.scheduledAt)
  if (Number.isNaN(scheduledDate.getTime())) {
    return { success: false, error: 'Horario invalido.' }
  }

  const minimumStartTime = Date.now() + 2 * 60 * 60 * 1000
  if (scheduledDate.getTime() < minimumStartTime) {
    return { success: false, error: 'Selecione um horario com pelo menos 2 horas de antecedencia.' }
  }

  const maximumDate = new Date()
  maximumDate.setDate(maximumDate.getDate() + 30)
  if (scheduledDate.getTime() > maximumDate.getTime()) {
    return { success: false, error: 'Agendamentos devem estar dentro de 30 dias.' }
  }

  const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000)

  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('professional_id', bookingInput.professionalId)
    .in('status', ['pending', 'confirmed'])
    .lt('scheduled_at', endDate.toISOString())
    .gt(
      'scheduled_at',
      new Date(scheduledDate.getTime() - durationMinutes * 60 * 1000).toISOString()
    )

  if (conflicts && conflicts.length > 0) {
    return {
      success: false,
      error: 'Este horario ja esta reservado. Por favor, escolha outro.',
    }
  }

  const currency = profile?.currency || 'BRL'
  const rates: Record<string, number> = {
    BRL: 1,
    USD: 0.19,
    EUR: 0.17,
    GBP: 0.15,
    CAD: 0.26,
    AUD: 0.29,
  }
  const priceUserCurrency = priceBrl * (rates[currency] || 1)

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      professional_id: bookingInput.professionalId,
      scheduled_at: bookingInput.scheduledAt,
      duration_minutes: durationMinutes,
      status: 'pending',
      price_brl: priceBrl,
      price_user_currency: priceUserCurrency,
      user_currency: currency,
      notes: bookingInput.notes || null,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: 'Erro ao criar agendamento. Tente novamente.' }
  }

  return { success: true, bookingId: booking.id }
}
