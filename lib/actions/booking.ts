'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createBooking(data: {
  professionalId: string
  scheduledAt: string
  notes?: string
}): Promise<{ success: true; bookingId: string } | { success: false; error: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user profile for currency
  const { data: profile } = await supabase
    .from('profiles')
    .select('currency, timezone')
    .eq('id', user.id)
    .single()

  // Verify professional still exists and is approved
  const { data: professional } = await supabase
    .from('professionals')
    .select('id, session_price_brl, session_duration_minutes, status')
    .eq('id', data.professionalId)
    .single()

  if (!professional || professional.status !== 'approved') {
    return { success: false, error: 'Profissional não disponível.' }
  }

  const durationMinutes = professional.session_duration_minutes
  const priceBrl = professional.session_price_brl

  // Check for conflicting bookings at the same time slot
  const scheduledDate = new Date(data.scheduledAt)
  if (Number.isNaN(scheduledDate.getTime())) {
    return { success: false, error: 'Horário inválido.' }
  }
  const endDate = new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000)

  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('professional_id', data.professionalId)
    .in('status', ['pending', 'confirmed'])
    .lt('scheduled_at', endDate.toISOString())
    .gt(
      'scheduled_at',
      new Date(scheduledDate.getTime() - durationMinutes * 60 * 1000).toISOString()
    )

  if (conflicts && conflicts.length > 0) {
    return {
      success: false,
      error: 'Este horário já está reservado. Por favor, escolha outro.',
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
      professional_id: data.professionalId,
      scheduled_at: data.scheduledAt,
      duration_minutes: durationMinutes,
      status: 'pending',
      price_brl: priceBrl,
      price_user_currency: priceUserCurrency,
      user_currency: currency,
      notes: data.notes || null,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: 'Erro ao criar agendamento. Tente novamente.' }
  }

  return { success: true, bookingId: booking.id }
}

