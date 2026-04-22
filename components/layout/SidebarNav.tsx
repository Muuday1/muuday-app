'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Calendar, User, Settings, Shield, Heart, Wallet, MessageCircle, Layers, FileText, ShieldAlert } from 'lucide-react'

type NavItem = {
  href: string
  icon: string
  label: string
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

export function SidebarNav({
  navItems,
  unreadMessageCount = 0,
}: {
  navItems: NavItem[]
  unreadMessageCount?: number
}) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map(({ href, icon, label }) => {
        const Icon = iconMap[icon] || LayoutDashboard
        const isActive = pathname === href || pathname.startsWith(`${href}/`)
        const showBadge = icon === 'MessageCircle' && unreadMessageCount > 0

        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group ${
              isActive
                ? 'bg-[#9FE870]/8 text-[#3d6b1f]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/70'
            }`}
          >
            <Icon className={`w-4 h-4 transition-colors ${
              isActive ? 'text-[#9FE870]' : 'text-slate-400 group-hover:text-[#9FE870]'
            }`} />
            <span className="flex-1">{label}</span>
            {showBadge && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
