'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { enqueueBookingCalendarSync } from '@/lib/calendar/sync/events'
import {
  emitProfessionalReceivedBooking,
  emitUserStartedCheckout,
} from '@/lib/email/resend-events'
import { executeBookingCreation, createBookingInputSchema } from '@/lib/booking/create-booking'

export async function createBooking(data: {
  professionalId: string
  serviceId?: string
  scheduledAt?: string
  notes?: string
  sessionPurpose?: string
  bookingType?: 'one_off' | 'recurring' | 'batch'
  recurringPeriodicity?: 'weekly' | 'biweekly' | 'monthly' | 'custom_days'
  recurringIntervalDays?: number
  recurringOccurrences?: number
  recurringSessionsCount?: number
  recurringEndDate?: string
  recurringAutoRenew?: boolean
  batchDates?: string[]
}): Promise<{ success: true; bookingId: string } | { success: false; error: string }> {
  Sentry.addBreadcrumb({ category: 'booking', message: 'createBooking (server action) started', level: 'info', data })

  const parsedInput = createBookingInputSchema.safeParse(data)
  if (!parsedInput.success) {
    const firstError = parsedInput.error.issues[0]?.message || 'Dados inválidos para agendamento.'
    return { success: false, error: firstError }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rl = await rateLimit('bookingCreate', user.id)
  if (!rl.allowed) return { success: false, error: 'Muitas tentativas. Tente novamente em breve.' }

  const result = await executeBookingCreation(supabase, user, parsedInput.data)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // Calendar sync (non-blocking)
  const bookingIdsForCalendarSync = result.createdBookingIds
  await Promise.all(
    bookingIdsForCalendarSync.map(syncBookingId =>
      enqueueBookingCalendarSync({
        bookingId: syncBookingId,
        action: 'upsert_booking',
        source: 'booking.create',
      }),
    ),
  )

  // Revalidate paths
  revalidatePath('/agenda')
  revalidatePath('/dashboard')

  // Emit Resend automation events (non-blocking)
  if (result.professionalEmail) {
    emitProfessionalReceivedBooking(result.professionalEmail, {
      booking_id: result.bookingId,
      client_name: user.email || 'Cliente',
    })
  }
  if (user.email) {
    emitUserStartedCheckout(user.email, {
      booking_id: result.bookingId,
      professional_id: data.professionalId,
    })
  }

  return { success: true, bookingId: result.bookingId }
}
