import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { MobileNav } from '@/components/layout/MobileNav'
import { SidebarNav } from '@/components/layout/SidebarNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = user
    ? (await supabase.from('profiles').select('*').eq('id', user.id).single()).data
    : null

  const isProfissional = profile?.role === 'profissional'
  const isAdmin = profile?.role === 'admin'
  const isLoggedIn = !!user

  const navItems = (() => {
    if (!isLoggedIn) return []
    if (isAdmin) {
      return [
        { href: '/buscar', icon: 'Search', label: 'Buscar' },
        { href: '/agenda', icon: 'Calendar', label: 'Agenda' },
        { href: '/favoritos', icon: 'Heart', label: 'Favoritos' },
        { href: '/perfil', icon: 'User', label: 'Perfil' },
        { href: '/admin', icon: 'Shield', label: 'Admin' },
      ]
    }
    if (isProfissional) {
      return [
        { href: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
        { href: '/agenda', icon: 'Calendar', label: 'Calendario' },
        { href: '/financeiro', icon: 'Wallet', label: 'Financeiro' },
        { href: '/configuracoes', icon: 'Settings', label: 'Configuracoes' },
      ]
    }
    return [
      { href: '/buscar', icon: 'Search', label: 'Buscar' },
      { href: '/agenda', icon: 'Calendar', label: 'Bookings' },
      { href: '/favoritos', icon: 'Heart', label: 'Favoritos' },
      { href: '/perfil', icon: 'User', label: 'Perfil' },
    ]
  })()

  return (
    <div className="min-h-screen bg-[#f6f4ef] flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-neutral-100 flex-col fixed h-full z-10">
        <div className="p-6 border-b border-neutral-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">M</span>
            </div>
            <span className="font-display font-bold text-xl text-neutral-900 tracking-tight">muuday</span>
          </Link>
        </div>

        <SidebarNav navItems={navItems} />

        <div className="p-4 border-t border-neutral-100">
          {isLoggedIn ? (
            <>
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
            </>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all"
            >
              Entrar
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="md:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">M</span>
            </div>
            <span className="font-display font-bold text-lg text-neutral-900 tracking-tight">muuday</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    aria-label="Sair da conta"
                    className="h-8 px-2.5 rounded-full border border-neutral-200 text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs font-medium">Sair</span>
                  </button>
                </form>
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="h-8 px-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-all flex items-center"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>

        {children}
      </main>

      {isLoggedIn && <MobileNav navItems={navItems} />}
    </div>
  )
}
