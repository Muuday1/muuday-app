import { loadSignupCatalog } from '@/lib/actions/signup'
import SignupForm from '@/components/auth/SignupForm'

function sanitizeRedirectPath(value: string | null) {
  if (!value) return ''
  if (!value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { redirect: redirectParam, role: roleParam } = await searchParams
  const catalog = await loadSignupCatalog()

  const redirectPath = sanitizeRedirectPath(
    typeof redirectParam === 'string' ? redirectParam : null,
  )

  const requestedRole = typeof roleParam === 'string' ? roleParam : ''

  return (
    <SignupForm
      initialCatalog={catalog}
      redirectPath={redirectPath}
      requestedRole={requestedRole}
      origin={process.env.NEXT_PUBLIC_APP_URL || 'https://muuday.com'}
    />
  )
}
