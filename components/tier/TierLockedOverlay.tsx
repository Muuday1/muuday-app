import type { ReactNode } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { isTierAtLeast, TIER_LABELS, type ProfessionalTier } from '@/lib/tier-config'

type TierLockedOverlayProps = {
  currentTier: string | null | undefined
  requiredTier: ProfessionalTier
  featureName: string
  children: ReactNode
  plansHref?: string
}

export function TierLockedOverlay({
  currentTier,
  requiredTier,
  featureName,
  children,
  plansHref = '/planos',
}: TierLockedOverlayProps) {
  if (isTierAtLeast(currentTier || 'basic', requiredTier)) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-60">{children}</div>
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white/70 p-4">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/90 text-white">
            <Lock className="h-4 w-4" />
          </div>
          <p className="text-xs font-semibold text-slate-800">Disponível no plano {TIER_LABELS[requiredTier]}</p>
          <p className="mt-1 text-[11px] text-slate-600">{featureName}</p>
          <Link
            href={plansHref}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-[#9FE870] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ed85f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE870]/30"
          >
            Ver planos
          </Link>
        </div>
      </div>
    </div>
  )
}
