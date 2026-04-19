import CompleteAccountForm from '@/components/auth/CompleteAccountForm'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function normalizeRole(value: unknown): string {
  const normalized = String(value || '').toLowerCase().trim()
  if (normalized === 'admin' || normalized === 'profissional' || normalized === 'usuario') {
    return normalized
  }
  return 'usuario'
}

export default async function CompletarContaPage({ searchParams }: PageProps) {
  const { role, next } = await searchParams
  const roleHint = normalizeRole(role) || 'usuario'
  const nextParam = String(next || '')
  const safeNextPath =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && nextParam !== '/'
      ? nextParam
      : '/dashboard'
  return <CompleteAccountForm roleHint={roleHint} safeNextPath={safeNextPath} />
}
