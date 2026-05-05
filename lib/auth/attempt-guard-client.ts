type AuthAttemptAction = 'login' | 'signup' | 'oauth_start'

type AuthAttemptGuardResult = {
  allowed: boolean
  error?: string
}

export async function guardAuthAttempt(
  action: AuthAttemptAction,
  email?: string,
): Promise<AuthAttemptGuardResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    const response = await fetch('/api/auth/attempt-guard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, email }),
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))

    if (response.status === 429) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      return {
        allowed: false,
        error: data?.error || 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
      }
    }

    if (!response.ok) {
      return { allowed: true }
    }

    const data = (await response.json().catch(() => null)) as { allowed?: boolean; error?: string } | null
    if (data?.allowed === false) {
      return {
        allowed: false,
        error: data.error || 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
      }
    }

    return { allowed: true }
  } catch {
    return {
      allowed: false,
      error: 'Nao foi possivel verificar a tentativa. Tente novamente mais tarde.',
    }
  }
}
