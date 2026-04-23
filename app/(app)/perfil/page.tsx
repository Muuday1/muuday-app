export const metadata = { title: 'Meu Perfil | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail, Globe, Clock, Shield, MapPin, CalendarClock, ArrowRight, Pencil, SlidersHorizontal, Bell, MessageCircle } from 'lucide-react'
import { COUNTRIES } from '@/lib/utils'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import { ProfileAccountSettings } from '@/components/profile/ProfileAccountSettings'
import { PushNotificationToggle } from '@/components/pwa/PushNotificationToggle'
import { AppCard } from '@/components/ui/AppCard'
import { PageContainer } from '@/components/ui/AppShell'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,full_name,email,role,country,timezone,currency')
    .eq('id', user.id)
    .single()

  const isProfissional = profile?.role === 'profissional'
  const countryData = COUNTRIES.find(c => c.code === profile?.country)

  // If professional, fetch professional profile
  let professional = null
  let professionalSpecialties: string[] = []
  if (isProfissional) {
    const { data } = await getPrimaryProfessionalForUser(supabase, user.id)
    professional = data
    if (professional?.id) {
      const { data: linkRows } = await supabase
        .from('professional_specialties')
        .select('specialty_id')
        .eq('professional_id', professional.id)

      const specialtyIds = Array.from(
        new Set((linkRows || []).map((row: any) => String(row.specialty_id || '').trim()).filter(Boolean)),
      )

      if (specialtyIds.length > 0) {
        const { data: specialtyRows } = await supabase
          .from('specialties')
          .select('id,name_pt')
          .in('id', specialtyIds)
          .eq('is_active', true)

        professionalSpecialties = Array.from(
          new Set(
            (specialtyRows || [])
              .map((row: any) => String(row.name_pt || '').trim())
              .filter(Boolean),
          ),
        ).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
      }
    }
  }

  return (
    <PageContainer maxWidth="md">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-slate-900 mb-1">Meu Perfil</h1>
        <p className="text-slate-500">Gerencie suas informações pessoais</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-slate-200/80 overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-[#9FE870]/80 to-[#8ed85f] relative">
          <div className="absolute -bottom-8 left-6">
            <div className="w-20 h-20 rounded-lg bg-white border-4 border-white flex items-center justify-center text-[#3d6b1f] font-display font-bold text-2xl">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        <div className="pt-12 px-6 pb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl text-slate-900">{profile?.full_name}</h2>
                <Link
                  href="/editar-perfil"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3d6b1f] hover:text-[#3d6b1f] bg-[#9FE870]/8 hover:bg-[#9FE870]/10 px-3 py-1.5 rounded-md transition-all"
                >
                  <Pencil className="w-3 h-3" />
                  Editar perfil
                </Link>
              </div>
              <p className="text-sm text-slate-500 capitalize flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
                {profile?.role === 'profissional' ? 'Profissional' : profile?.role === 'admin' ? 'Administrador' : 'Utilizador'}
              </p>
            </div>
            {isProfissional && professional && (
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                professional.status === 'approved' ? 'bg-green-50 text-green-700' :
                professional.status === 'pending_review' ? 'bg-amber-50 text-amber-700' :
                professional.status === 'draft' ? 'bg-slate-100 text-slate-500' :
                'bg-red-50 text-red-600'
              }`}>
                {professional.status === 'approved' ? 'Aprovado' :
                 professional.status === 'pending_review' ? 'Em revisão' :
                 professional.status === 'draft' ? 'Rascunho' :
                 professional.status === 'rejected' ? 'Rejeitado' : 'Suspenso'}
              </span>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-md">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-700">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-md">
              <MapPin className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">País</p>
                <p className="text-sm font-medium text-slate-700">{countryData?.name || profile?.country || 'Não definido'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-md">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Fuso horário</p>
                <p className="text-sm font-medium text-slate-700">{profile?.timezone || 'Não definido'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-md">
              <Globe className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Moeda</p>
                <p className="text-sm font-medium text-slate-700">{profile?.currency || 'BRL'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional details */}
      {isProfissional && professional && (
        <AppCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-slate-900">Perfil Profissional</h3>
            <div className="flex items-center gap-2">
              <Link
                href="/onboarding-profissional"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-all"
              >
                Checklist C1-C10
              </Link>
              {professional.bio && (
                <Link
                  href="/editar-perfil-profissional"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3d6b1f] hover:text-[#3d6b1f] bg-[#9FE870]/8 hover:bg-[#9FE870]/10 px-3 py-1.5 rounded-md transition-all"
                >
                  <Pencil className="w-3 h-3" />
                  Editar perfil profissional
                </Link>
              )}
            </div>
          </div>

          {professional.bio ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Bio</p>
                <p className="text-sm text-slate-700 leading-relaxed">{professional.bio}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Especialidade principal</p>
                  <p className="text-sm font-medium text-slate-700">
                    {professionalSpecialties[0] || professional.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Preço por sessão</p>
                  <p className="text-sm font-medium text-slate-700">R$ {professional.session_price_brl?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Duração da sessão</p>
                  <p className="text-sm font-medium text-slate-700">{professional.session_duration_minutes} min</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Experiência</p>
                  <p className="text-sm font-medium text-slate-700">{professional.years_experience} anos</p>
                </div>
              </div>
              {professionalSpecialties.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Especialidades profissionais</p>
                  <div className="flex flex-wrap gap-2">
                    {professionalSpecialties.map((specialty: string) => (
                      <span key={specialty} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {professional.tags?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Foco de atuação</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-[#9FE870]/8 text-[#3d6b1f] px-2.5 py-1 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm mb-3">
                Complete seu perfil profissional para começar a receber clientes.
              </p>
              <Link
                href="/completar-perfil"
                className="inline-block bg-[#9FE870] hover:bg-[#8ed85f] text-white font-semibold px-5 py-2.5 rounded-md transition-all text-sm"
              >
                Completar perfil
              </Link>
            </div>
          )}
        </AppCard>
      )}

      {/* Availability link for professionals */}
      {isProfissional && professional && (
        <AppCard className="mb-6">
          <h3 className="font-display font-bold text-lg text-slate-900 mb-4">Agenda e disponibilidade</h3>
          <div className="space-y-3">
            <Link
              href="/disponibilidade"
              className="flex items-center justify-between p-4 bg-[#9FE870]/8 hover:bg-[#9FE870]/10 rounded-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#9FE870] rounded-md flex items-center justify-center">
                  <CalendarClock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2d5016]">Configurar disponibilidade</p>
                  <p className="text-xs text-[#3d6b1f]">Defina os dias e horários de atendimento</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9FE870] group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/configuracoes-agendamento"
              className="flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-100 rounded-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-900 rounded-md flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Regras de agendamento</p>
                  <p className="text-xs text-slate-600">Buffer, confirmação, recorrência e antecedência</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </AppCard>
      )}

      {/* Messages */}
      <AppCard className="mb-6">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Mensagens
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Converse com profissionais e clientes sobre seus agendamentos.
        </p>
        <Link
          href="/mensagens"
          className="inline-flex items-center gap-2 rounded-md bg-[#9FE870] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ed85f]"
        >
          Ver mensagens
          <ArrowRight className="h-4 w-4" />
        </Link>
      </AppCard>

      {/* Push Notifications */}
      <AppCard className="mb-6">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notificações
        </h3>
        <PushNotificationToggle />
      </AppCard>

      <ProfileAccountSettings />
    </PageContainer>
  )
}

