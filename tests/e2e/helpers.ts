import { expect, test, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Cookie consent dismissal
// ---------------------------------------------------------------------------

export async function dismissCookieDialogIfPresent(page: Page) {
  await page.locator('[data-testid="cookie-accept"]').first().click({ timeout: 2_000 }).catch(() => {})
  await page.locator('[data-testid="cookie-close"]').first().click({ timeout: 1_000 }).catch(() => {})
}

// ---------------------------------------------------------------------------
// UI login with retry and rate-limit handling
// ---------------------------------------------------------------------------

export async function login(
  page: Page,
  email: string,
  password: string,
  options?: {
    maxAttempts?: number
    rateLimitDelayMs?: number
    expectedPath?: RegExp
  },
) {
  const maxAttempts = options?.maxAttempts ?? 5
  const rateLimitDelayMs = options?.rateLimitDelayMs ?? 4_000
  const expectedPath = options?.expectedPath ?? /\/(buscar|dashboard)/

  await page.goto('/login')
  await dismissCookieDialogIfPresent(page)

  const emailInput = page.locator('#login-email, input[type="email"], input[name="email"]').first()
  const passwordInput = page.locator('#login-password, input[type="password"], input[name="password"]').first()
  const submitButton = page.locator('button[type="submit"]').first()

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await dismissCookieDialogIfPresent(page)
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await submitButton.click().catch(async () => {
      await dismissCookieDialogIfPresent(page)
      await submitButton.click()
    })

    try {
      await page.waitForURL(expectedPath, { timeout: 30_000 })
      return
    } catch {
      let rateLimited = 0
      try {
        rateLimited = await page.locator('[data-testid="login-error"][data-error-type="rate-limited"]').count()
      } catch {
        throw new Error(`E2E login failed: page became unavailable during login (url=${page.url()}).`)
      }
      if (rateLimited > 0 && attempt < maxAttempts - 1) {
        await page.waitForTimeout(rateLimitDelayMs)
        continue
      }

      const invalidCredentials = await page.locator('[data-testid="login-error"][data-error-type="invalid-credentials"]').count()
      if (invalidCredentials > 0) {
        throw new Error('E2E login failed: invalid credentials for configured user.')
      }

      throw new Error(`E2E login failed: no redirect after submit (url=${page.url()}).`)
    }
  }
}

export async function loginAsUser(page: Page) {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD
  if (!email || !password) {
    throw new Error('Missing E2E_USER_EMAIL or E2E_USER_PASSWORD environment variables.')
  }
  await login(page, email, password)
}

export async function loginAsAdmin(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL || process.env.E2E_USER_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_USER_PASSWORD
  if (!email || !password) {
    throw new Error('Missing E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD or E2E_USER_EMAIL / E2E_USER_PASSWORD environment variables.')
  }
  await login(page, email, password, { expectedPath: /\/admin/ })

  // Some admins land on /buscar and navigate manually
  const url = page.url()
  if (!url.includes('/admin')) {
    await page.goto('/admin')
    await page.waitForLoadState('domcontentloaded')
  }
}

// ---------------------------------------------------------------------------
// API login (for api-v1-smoke and other API-first specs)
// ---------------------------------------------------------------------------

export async function loginViaApi(
  request: typeof test.prototype.request,
): Promise<{ token: string; sessionJson: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD

  if (!email || !password) {
    throw new Error('Missing E2E_USER_EMAIL or E2E_USER_PASSWORD environment variables.')
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    },
    data: { email, password },
  })

  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body).toHaveProperty('access_token')

  const sessionJson = JSON.stringify({
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_in: body.expires_in,
    expires_at: body.expires_at,
    token_type: body.token_type,
    user: body.user,
  })

  return { token: body.access_token as string, sessionJson }
}
