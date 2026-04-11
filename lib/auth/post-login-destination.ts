export function resolvePostLoginDestination(role?: string | null) {
  return role === 'profissional' ? '/dashboard' : '/buscar-auth'
}

