import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Globe, Bell, Lock, Palette, ChevronRight } from 'lucide-react'

export default async function ConfiguracoesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  type SettingItem = { label: string; value: string; action: string; isLink?: boolean }
  const settingsGroups: { title: string; icon: typeof Globe; items: SettingItem[] }[] = [
    {
      title: 'Idioma e região',
      icon: Globe,
      items: [
        { label: 'Idioma', value: 'Português (BR)', action: 'Em breve' },
        { label: 'Fuso horário', value: profile?.timezone || 'America/Sao_Paulo', action: 'Em breve' },
        { label: 'Moeda preferida', value: profile?.currency || 'BRL', action: 'Em breve' },
      ],
    },
    {
      title: 'Notificações',
      icon: Bell,
      items: [
        { label: 'Emails de agendamento', value: 'Ativado', action: 'Em breve' },
        { label: 'Lembretes de sessão', value: 'Ativado', action: 'Em breve' },
        { label: 'Novidades e promoções', value: 'Ativado', action: 'Em breve' },
      ],
    },
    {
      title: 'Segurança',
      icon: Lock,
      items: [
        { label: 'Alterar senha', value: '', action: '/recuperar-senha', isLink: true },
        { label: 'Autenticação de dois fatores', value: 'Desativado', action: 'Em breve' },
      ],
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-neutral-900 mb-1">Configurações</h1>
        <p className="text-neutral-500">Personalize sua experiência na Muuday</p>
      </div>

      <div className="space-y-6">
        {settingsGroups.map(group => (
          <div key={group.title} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-50 flex items-center gap-3">
              <group.icon className="w-4 h-4 text-brand-500" />
              <h2 className="font-display font-bold text-neutral-900">{group.title}</h2>
            </div>
            <div className="divide-y divide-neutral-50">
              {group.items.map(item => (
                <div key={item.label} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">{item.label}</p>
                    {item.value && <p className="text-xs text-neutral-400 mt-0.5">{item.value}</p>}
                  </div>
                  {item.isLink ? (
                    <a
                      href={item.action}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium bg-brand-50 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
                    >
                      Alterar <ChevronRight className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-full font-medium">
                      {item.action}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="mt-8 bg-white rounded-2xl border border-red-100 p-6">
        <h3 className="font-display font-bold text-red-700 mb-2">Zona de risco</h3>
        <p className="text-sm text-neutral-500 mb-4">Ações irreversíveis para sua conta.</p>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 font-medium px-4 py-2 rounded-xl border border-red-200 transition-all"
          >
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  )
}
