import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { MobileNav } from '@/components/layout/MobileNav'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt'
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration'
import { PublicPageLayout } from '@/components/public/PublicPageLayout'
import { getLayoutSession } from '@/lib/auth/layout-session'
import { getConversationsAction } from '@/lib/actions/chat'
import { getUnreadNotificationCountAction } from '@/lib/actions/notifications'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getLayoutSession()

  const isProfissional = profile?.role === 'profissional'
  const isAdmin = profile?.role === 'admin'
  const isLoggedIn = !!user

  if (!isLoggedIn) {
    return <PublicPageLayout>{children}</PublicPageLayout>
  }

  // Fetch unread message count for badge
  const conversationsResult = await getConversationsAction()
  const unreadMessageCount = conversationsResult.success
    ? conversationsResult.data.conversations.reduce((sum, c) => sum + c.unreadCount, 0)
    : 0

  // Fetch unread notification count for badge
  const notificationsResult = await getUnreadNotificationCountAction()
  const unreadNotificationCount = notificationsResult.success ? notificationsResult.data.count : 0

  const navItems = (() => {
    if (isAdmin) {
      return [
        { href: '/buscar-auth', icon: 'Search', label: 'Buscar' },
        { href: '/agenda', icon: 'Calendar', label: 'Agenda' },
        { href: '/mensagens', icon: 'MessageCircle', label: 'Mensagens' },
        { href: '/notificacoes', icon: 'Bell', label: 'Notificações' },
        { href: '/favoritos', icon: 'Heart', label: 'Favoritos' },
        { href: '/perfil', icon: 'User', label: 'Perfil' },
        { href: '/admin', icon: 'Shield', label: 'Admin' },
      ]
    }
    if (isProfissional) {
      return [
        { href: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
        { href: '/agenda', icon: 'Calendar', label: 'Calendário' },
        { href: '/mensagens', icon: 'MessageCircle', label: 'Mensagens' },
        { href: '/notificacoes', icon: 'Bell', label: 'Notificações' },
        { href: '/servicos', icon: 'Layers', label: 'Serviços' },
        { href: '/prontuario', icon: 'FileText', label: 'Prontuário' },
        { href: '/financeiro', icon: 'Wallet', label: 'Financeiro' },
        { href: '/configuracoes', icon: 'Settings', label: 'Configurações' },
      ]
    }
    return [
      { href: '/buscar-auth', icon: 'Search', label: 'Buscar' },
      { href: '/agenda', icon: 'Calendar', label: 'Agenda' },
      { href: '/mensagens', icon: 'MessageCircle', label: 'Mensagens' },
      { href: '/favoritos', icon: 'Heart', label: 'Favoritos' },
      { href: '/disputas', icon: 'ShieldAlert', label: 'Disputas' },
      { href: '/perfil', icon: 'User', label: 'Perfil' },
    ]
  })()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/80 flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-200/80">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#9FE870] rounded-md flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">M</span>
            </div>
            <span className="font-display font-bold text-xl text-slate-900 tracking-tight">muuday</span>
          </Link>
        </div>

        <SidebarNav navItems={navItems} unreadMessageCount={unreadMessageCount} unreadNotificationCount={unreadNotificationCount} />

        <div className="p-4 border-t border-slate-200/80">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="w-8 h-8 rounded-md bg-[#9FE870]/10 flex items-center justify-center text-[#3d6b1f] font-semibold text-sm flex-shrink-0">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name}</p>
                  <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
                </div>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md bg-[#9FE870] hover:bg-[#8ed85f] text-white text-sm font-semibold transition-all"
            >
              Login
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#9FE870] rounded-md flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">M</span>
            </div>
            <span className="font-display font-bold text-lg text-slate-900 tracking-tight">muuday</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <NotificationBell />
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    aria-label="Sair da conta"
                    className="h-8 w-8 rounded-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
                <div className="w-8 h-8 rounded-md bg-[#9FE870]/10 flex items-center justify-center text-[#3d6b1f] font-semibold text-sm">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="h-8 px-3 rounded-md bg-[#9FE870] hover:bg-[#8ed85f] text-white text-xs font-semibold transition-all flex items-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {children}
      </main>

      <MobileNav navItems={navItems} unreadMessageCount={unreadMessageCount} unreadNotificationCount={unreadNotificationCount} />
      <PwaInstallPrompt />
      <ServiceWorkerRegistration />
    </div>
  )
}
