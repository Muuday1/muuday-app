import CompleteAccountForm from '@/components/auth/CompleteAccountForm'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

function normalizeRole(value: unknown): string {
  const normalized = String(value || '').toLowerCase().trim()
  if (normalized === 'admin' || normalized === 'profissional' || normalized === 'usuario') {
    return normalized
  }
  return 'usuario'
}

export default function CompletarContaPage({ searchParams }: PageProps) {
  const roleHint = normalizeRole(searchParams.role) || 'usuario'
  const nextParam = String(searchParams.next || '')
  const safeNextPath =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') && nextParam !== '/'
      ? nextParam
      : ''

  return <CompleteAccountForm roleHint={roleHint} safeNextPath={safeNextPath} />
}
