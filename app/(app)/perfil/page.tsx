export const metadata = { title: 'Meu Perfil | Muuday' }

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Globe, Clock, Shield, MapPin, CalendarClock, ArrowRight, Pencil, Bell, SlidersHorizontal } from 'lucide-react'
import { COUNTRIES } from '@/lib/utils'

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isProfissional = profile?.role === 'profissional'
  const countryData = COUNTRIES.find(c => c.code === profile?.country)

  // If professional, fetch professional profile
  let professional = null
  if (isProfissional) {
    const { data } = await supabase
      .from('professionals')
      .select('*')
      .eq('user_id', user.id)
      .single()
    professional = data
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">Meu Perfil</h1>
        <p className="text-neutral-500">Gerencie suas informações pessoais</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-brand-400 to-brand-600 relative">
          <div className="absolute -bottom-8 left-6">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-sm flex items-center justify-center text-brand-600 font-display font-bold text-2xl">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        <div className="pt-12 px-6 pb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-xl text-neutral-900">{profile?.full_name}</h2>
                <Link
                  href="/editar-perfil"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-all"
                >
                  <Pencil className="w-3 h-3" />
                  Editar perfil
                </Link>
              </div>
              <p className="text-sm text-neutral-500 capitalize flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
                {profile?.role === 'profissional' ? 'Profissional' : profile?.role === 'admin' ? 'Administrador' : 'Utilizador'}
              </p>
            </div>
            {isProfissional && professional && (
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                professional.status === 'approved' ? 'bg-green-50 text-green-700' :
                professional.status === 'pending_review' ? 'bg-amber-50 text-amber-700' :
                professional.status === 'draft' ? 'bg-neutral-100 text-neutral-500' :
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
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <Mail className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-400">Email</p>
                <p className="text-sm font-medium text-neutral-700">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-400">País</p>
                <p className="text-sm font-medium text-neutral-700">{countryData?.name || profile?.country || 'Não definido'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <Clock className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-400">Fuso horário</p>
                <p className="text-sm font-medium text-neutral-700">{profile?.timezone || 'Não definido'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <Globe className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-400">Moeda</p>
                <p className="text-sm font-medium text-neutral-700">{profile?.currency || 'BRL'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional details */}
      {isProfissional && professional && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-neutral-900">Perfil Profissional</h3>
            {professional.bio && (
              <Link
                href="/editar-perfil-profissional"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-all"
              >
                <Pencil className="w-3 h-3" />
                Editar perfil profissional
              </Link>
            )}
          </div>

          {professional.bio ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-neutral-400 mb-1">Bio</p>
                <p className="text-sm text-neutral-700 leading-relaxed">{professional.bio}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Categoria</p>
                  <p className="text-sm font-medium text-neutral-700 capitalize">{professional.category}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Preço por sessão</p>
                  <p className="text-sm font-medium text-neutral-700">R$ {professional.session_price_brl?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Duração da sessão</p>
                  <p className="text-sm font-medium text-neutral-700">{professional.session_duration_minutes} min</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Experiência</p>
                  <p className="text-sm font-medium text-neutral-700">{professional.years_experience} anos</p>
                </div>
              </div>
              {professional.tags?.length > 0 && (
                <div>
                  <p className="text-xs text-neutral-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {professional.tags.map((tag: string) => (
                      <span key={tag} className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-neutral-500 text-sm mb-3">
                Complete seu perfil profissional para começar a receber clientes.
              </p>
              <Link
                href="/completar-perfil"
                className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
              >
                Completar perfil
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Availability link for professionals */}
      {isProfissional && professional && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-6">
          <h3 className="font-display font-bold text-lg text-neutral-900 mb-4">Agenda e disponibilidade</h3>
          <div className="space-y-3">
            <Link
              href="/disponibilidade"
              className="flex items-center justify-between p-4 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                  <CalendarClock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-900">Configurar disponibilidade</p>
                  <p className="text-xs text-brand-600">Defina os dias e horarios de atendimento</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/configuracoes-agendamento"
              className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-neutral-900 rounded-xl flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Regras de agendamento</p>
                  <p className="text-xs text-neutral-600">Buffer, confirmacao, recorrencia e antecedencia</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-neutral-900">Conta</h3>
          <Link
            href="/configuracoes"
            className="text-xs text-brand-600 hover:text-brand-700 font-medium bg-brand-50 px-3 py-1.5 rounded-full transition-all"
          >
            Notificacoes e preferencias
          </Link>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-neutral-50">
            <div>
              <p className="text-sm font-medium text-neutral-700">Membro desde</p>
              <p className="text-xs text-neutral-400">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                  : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-neutral-700">Alterar senha</p>
              <p className="text-xs text-neutral-400">Redefina sua senha de acesso</p>
            </div>
            <a
              href="/recuperar-senha"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium bg-brand-50 px-3 py-1.5 rounded-full transition-all"
            >
              Alterar
            </a>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-500" />
              <div>
                <p className="text-sm font-medium text-neutral-700">Notificacoes</p>
                <p className="text-xs text-neutral-400">Ative e ajuste lembretes, emails e novidades</p>
              </div>
            </div>
            <Link
              href="/configuracoes"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium bg-brand-50 px-3 py-1.5 rounded-full transition-all"
            >
              Gerir
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

