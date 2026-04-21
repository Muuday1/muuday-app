'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Calendar, User, Settings, Shield, Heart, Wallet, MessageCircle, Layers, FileText, ShieldAlert } from 'lucide-react'

type NavItem = {
  href: string
  icon: string
  label: string
  hide?: boolean
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Search,
  Calendar,
  User,
  Settings,
  Shield,
  Heart,
  Wallet,
  MessageCircle,
  Layers,
  FileText,
  ShieldAlert,
}

export function MobileNav({
  navItems,
}: {
  navItems: NavItem[]
}) {
  const pathname = usePathname()

  // Show max 5 items on mobile
  const mobileItems = navItems.slice(0, 5)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/80 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileItems.map(({ href, icon, label }) => {
          const Icon = iconMap[icon] || LayoutDashboard
          const isActive = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-all min-w-[60px] ${
                isActive
                  ? 'text-[#3d6b1f]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {isActive && (
                <div className="absolute -top-2 w-8 h-0.5 bg-[#9FE870] rounded-full" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#9FE870]' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-[#3d6b1f]' : ''}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
