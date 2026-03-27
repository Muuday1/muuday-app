export const metadata = { title: 'Agendar Sessão | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CATEGORIES } from '@/types'
import BookingForm from '@/components/booking/BookingForm'

export default async function AgendarPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch professional with profile
  const { data: professional } = await supabase
    .from('professionals')
    .select('*, profiles(*)')
    .eq('id', params.id)
    .single()

  if (!professional || professional.status !== 'approved') {
    notFound()
  }

  // Prevent professionals from booking themselves
  if (professional.user_id === user.id) {
    redirect(`/profissional/${params.id}`)
  }

  // Fetch user profile for timezone and currency
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone, currency, full_name')
    .eq('id', user.id)
    .single()

  // Fetch professional's weekly availability
  const { data: availability } = await supabase
    .from('availability')
    .select('id, day_of_week, start_time, end_time')
    .eq('professional_id', professional.id)
    .eq('is_active', true)
    .order('day_of_week')

  // Fetch existing bookings for the next 30 days to block already-booked slots
  const now = new Date()
  const thirtyDaysLater = new Date(now)
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('scheduled_at, duration_minutes')
    .eq('professional_id', professional.id)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', thirtyDaysLater.toISOString())

  const profProfile = professional.profiles as any
  const category = CATEGORIES.find(c => c.slug === professional.category)

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-100 px-6 md:px-8 py-5">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display font-bold text-2xl text-neutral-900">
            Agendar sessão
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {profProfile?.full_name}
            {category ? ` · ${category.icon} ${category.name}` : ''}
            {' · '}
            {professional.session_duration_minutes} min
          </p>
        </div>
      </div>

      <BookingForm
        professional={{
          id: professional.id,
          session_price_brl: professional.session_price_brl,
          session_duration_minutes: professional.session_duration_minutes,
          category: professional.category,
        }}
        profileName={profProfile?.full_name || 'Profissional'}
        availability={availability || []}
        existingBookings={existingBookings || []}
        userTimezone={profile?.timezone || 'America/Sao_Paulo'}
        userCurrency={profile?.currency || 'BRL'}
      />
    </div>
  )
}
