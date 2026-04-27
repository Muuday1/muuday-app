'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Calendar, User, Settings, Shield, Heart, Wallet, MessageCircle, Layers, FileText, ShieldAlert, Bell } from 'lucide-react'

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
  Bell,
}

export function MobileNav({
  navItems,
  unreadMessageCount = 0,
  unreadNotificationCount = 0,
}: {
  navItems: NavItem[]
  unreadMessageCount?: number
  unreadNotificationCount?: number
}) {
  const pathname = usePathname()

  // Show all items on mobile (scrollable if needed)
  const mobileItems = navItems

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/80 safe-area-bottom">
      <div className="flex items-center overflow-x-auto scrollbar-hide px-1 py-2">
        {mobileItems.map(({ href, icon, label }) => {
          const Icon = iconMap[icon] || LayoutDashboard
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          const showMessageBadge = icon === 'MessageCircle' && unreadMessageCount > 0
          const showNotificationBadge = icon === 'Bell' && unreadNotificationCount > 0

          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition-all flex-shrink-0 min-w-[48px] ${
                isActive
                  ? 'text-[#3d6b1f]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {isActive && (
                <div className="absolute -top-2 w-8 h-0.5 bg-[#9FE870] rounded-full" />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#9FE870]' : ''}`} />
                {(showMessageBadge || showNotificationBadge) && (
                  <span className="absolute -right-2 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {showMessageBadge
                      ? unreadMessageCount > 9 ? '9+' : unreadMessageCount
                      : unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </div>
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
