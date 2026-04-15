import React from 'react'

type AdminProfessionalIdentityBadgeProps = {
  fullName?: string | null
  email?: string | null
  avatarUrl?: string | null
  subtitle?: string
  size?: 'sm' | 'md'
}

export function AdminProfessionalIdentityBadge({
  fullName,
  email,
  avatarUrl,
  subtitle,
  size = 'sm',
}: AdminProfessionalIdentityBadgeProps) {
  const safeName = String(fullName || '').trim() || 'Profissional'
  const initial = safeName.charAt(0).toUpperCase()
  const avatarSizeClass = size === 'md' ? 'h-12 w-12' : 'h-10 w-10'

  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`Foto de ${safeName}`}
          className={`${avatarSizeClass} rounded-full border border-neutral-200 object-cover`}
        />
      ) : (
        <div className={`${avatarSizeClass} rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm`}>
          {initial}
        </div>
      )}
      <div>
        <p className="font-medium text-neutral-900">{safeName}</p>
        {subtitle ? <p className="text-sm text-neutral-500">{subtitle}</p> : null}
        {!subtitle && email ? <p className="text-sm text-neutral-500">{email}</p> : null}
      </div>
    </div>
  )
}
