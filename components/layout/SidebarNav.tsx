'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Calendar, User, Settings, Shield, Heart } from 'lucide-react'

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
}

export function SidebarNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map(({ href, icon, label }) => {
        const Icon = iconMap[icon] || LayoutDashboard
        const isActive = pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Icon className={`w-4 h-4 transition-colors ${
              isActive ? 'text-brand-500' : 'text-neutral-400 group-hover:text-brand-500'
            }`} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
