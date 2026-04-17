export function resolvePostLoginDestination(role?: string | null) {
  const normalizedRole = String(role || '').toLowerCase().trim()
  if (normalizedRole === 'admin') return '/admin'
  if (normalizedRole === 'profissional') return '/dashboard'
  return '/buscar-auth'
}
