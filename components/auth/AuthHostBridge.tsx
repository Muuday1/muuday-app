'use client'

import { useEffect } from 'react'

function normalizeConfiguredUrl(value: string | undefined) {
  const trimmed = String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '')
    .replace(/\/+$/, '')

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return ''
  }

  return trimmed
}

function hasPortableAuthHash(hash: string) {
  if (!hash.startsWith('#')) return false

  const params = new URLSearchParams(hash.slice(1))
  return (
    params.has('access_token') ||
    params.has('refresh_token') ||
    params.get('type') === 'magiclink' ||
    params.get('type') === 'recovery'
  )
}

export function AuthHostBridge() {
  useEffect(() => {
    const canonicalBaseUrl = normalizeConfiguredUrl(process.env.NEXT_PUBLIC_APP_URL)
    if (!canonicalBaseUrl) return
    if (!hasPortableAuthHash(window.location.hash)) return

    const currentOrigin = window.location.origin.replace(/\/+$/, '')
    if (currentOrigin === canonicalBaseUrl) return

    const targetUrl = new URL(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
      canonicalBaseUrl,
    )

    window.location.replace(targetUrl.toString())
  }, [])

  return null
}
