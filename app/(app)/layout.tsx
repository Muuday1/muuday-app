import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { MobileNav } from '@/components/layout/MobileNav'
import { SidebarNav } from '@/components/layout/SidebarNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isProfissional = profile?.role === 'profissional'
  const isAdmin = profile?.role === 'admin'

  const navItems = [
    { href: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
    { href: '/buscar', icon: 'Search', label: 'Buscar', hide: isProfissional },
    { href: '/favoritos', icon: 'Heart', label: 'Favoritos', hide: isProfissional },
    { href: '/agenda', icon: 'Calendar', label: 'Agenda' },
    { href: '/perfil', icon: 'User', label: 'Meu Perfil' },
    { href: '/configuracoes', icon: 'Settings', label: 'Configurações' },
    { href: '/admin', icon: 'Shield', label: 'Admin', hide: !isAdmin },
  ].filter(item => !item.hide)

  return (
    <div className="min-h-screen bg-[#f6f4ef] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-neutral-100 flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-neutral-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">M</span>
            </div>
            <span className="font-display font-bold text-xl text-neutral-900 tracking-tight">muuday</span>
          </Link>
        </div>

        {/* Nav */}
        <SidebarNav navItems={navItems} />

        {/* User profile */}
        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm flex-shrink-0">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-neutral-400 capitalize">{profile?.role}</p>
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen pb-20 md:pb-0">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">M</span>
            </div>
            <span className="font-display font-bold text-lg text-neutral-900 tracking-tight">muuday</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm">
              {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileNav
        navItems={navItems}
        isProfissional={isProfissional}
      />
    </div>
  )
}
