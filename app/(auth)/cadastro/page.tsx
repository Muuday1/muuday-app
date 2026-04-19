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
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const catalog = await loadSignupCatalog()

  const redirectParam = searchParams.redirect
  const redirectPath = sanitizeRedirectPath(
    typeof redirectParam === 'string' ? redirectParam : null,
  )

  const roleParam = searchParams.role
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
