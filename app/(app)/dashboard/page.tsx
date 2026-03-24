import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Search, Star, ArrowRight, Clock, CalendarClock, Users } from 'lucide-react'
import { CATEGORIES } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select(`*, professionals(*, profiles(*))`)
    .eq('user_id', user.id)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(3)

  const firstName = profile?.full_name?.split(' ')[0] || 'Bem-vindo'
  const isProfissional = profile?.role === 'profissional'

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">
          Olá, {firstName} 👋
        </h1>
        <p className="text-neutral-500">
          {isProfissional
            ? 'Gerencie suas sessões e clientes'
            : 'Encontre o especialista certo para você'}
        </p>
      </div>

      {/* Quick actions */}
      {!isProfissional && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/buscar" className="group bg-brand-500 hover:bg-brand-600 text-white p-5 rounded-2xl transition-all">
            <Search className="w-6 h-6 mb-3 opacity-80" />
            <p className="font-semibold">Buscar profissional</p>
            <p className="text-sm text-white/70 mt-0.5">Encontre o especialista certo</p>
          </Link>
          <Link href="/agenda" className="group bg-white hover:shadow-md text-neutral-800 p-5 rounded-2xl border border-neutral-100 transition-all">
            <Calendar className="w-6 h-6 mb-3 text-brand-500" />
            <p className="font-semibold">Minha agenda</p>
            <p className="text-sm text-neutral-400 mt-0.5">Ver próximas sessões</p>
          </Link>
          <Link href="/favoritos" className="group bg-white hover:shadow-md text-neutral-800 p-5 rounded-2xl border border-neutral-100 transition-all">
            <Star className="w-6 h-6 mb-3 text-accent-500" />
            <p className="font-semibold">Favoritos</p>
            <p className="text-sm text-neutral-400 mt-0.5">Seus profissionais salvos</p>
          </Link>
        </div>
      )}

      {/* Professional quick actions */}
      {isProfissional && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link href="/agenda" className="group bg-brand-500 hover:bg-brand-600 text-white p-5 rounded-2xl transition-all">
            <Users className="w-6 h-6 mb-3 opacity-80" />
            <p className="font-semibold">Minha agenda</p>
            <p className="text-sm text-white/70 mt-0.5">Gerenciar sessões com clientes</p>
          </Link>
          <Link href="/disponibilidade" className="group bg-white hover:shadow-md text-neutral-800 p-5 rounded-2xl border border-neutral-100 transition-all">
            <CalendarClock className="w-6 h-6 mb-3 text-brand-500" />
            <p className="font-semibold">Disponibilidade</p>
            <p className="text-sm text-neutral-400 mt-0.5">Configure seus horários de atendimento</p>
          </Link>
        </div>
      )}

      {/* Upcoming bookings */}
      {upcomingBookings && upcomingBookings.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-neutral-900">Próximas sessões</h2>
            <Link href="/agenda" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 text-sm">
                    {booking.professionals?.profiles?.full_name || 'Profissional'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(booking.scheduled_at).toLocaleDateString('pt-BR', {
                      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  booking.status === 'confirmed'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {booking.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {!isProfissional && (
        <div>
          <h2 className="font-display font-bold text-lg text-neutral-900 mb-4">Explorar por especialidade</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                href={`/buscar?categoria=${cat.slug}`}
                className="bg-white hover:shadow-md border border-neutral-100 rounded-2xl p-4 text-center transition-all group"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="font-semibold text-sm text-neutral-800">{cat.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
