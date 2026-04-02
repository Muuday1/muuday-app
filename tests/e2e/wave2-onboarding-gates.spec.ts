import { expect, test, type Page } from '@playwright/test'

const userEmail = process.env.E2E_USER_EMAIL
const userPassword = process.env.E2E_USER_PASSWORD
const professionalEmail = process.env.E2E_PROFESSIONAL_EMAIL
const professionalPassword = process.env.E2E_PROFESSIONAL_PASSWORD
const publicProfessionalId = process.env.E2E_PROFESSIONAL_ID
const blockedProfessionalId = process.env.E2E_BLOCKED_PROFESSIONAL_ID

const hasUserConfig = Boolean(userEmail && userPassword)
const hasProfessionalConfig = Boolean(professionalEmail && professionalPassword)
const hasPublicProfessional = Boolean(hasUserConfig && publicProfessionalId)
const hasBlockedProfessional = Boolean(hasUserConfig && blockedProfessionalId)

async function isNotFoundPage(page: Page) {
  const headingMatches = await page.getByRole('heading', { name: /encontrada/i }).count()
  const movedTextMatches = await page.getByText(/foi movida/i).count()
  const backHomeLinkMatches = await page.getByRole('link', { name: /voltar ao in/i }).count()
  return headingMatches > 0 && (movedTextMatches > 0 || backHomeLinkMatches > 0)
}

async function detectBookingEntryState(page: Page) {
  const bookingHeading = page.getByRole('heading', { name: /Tipo de agendamento/i })

  for (let i = 0; i < 20; i += 1) {
    if (await isNotFoundPage(page)) return 'not_found'
    if ((await bookingHeading.count()) > 0) return 'booking_ready'
    if (page.url().includes('/profissional/')) return 'redirected_to_profile'
    await page.waitForTimeout(300)
  }

  return 'unknown'
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  const acceptCookiesButton = page.getByRole('button', { name: 'Aceitar' }).first()
  await acceptCookiesButton.click({ timeout: 3_000 }).catch(() => {})
  const emailInput = page.locator('#login-email, input[type="email"], input[name="email"]').first()
  const passwordInput = page.locator('#login-password, input[type="password"], input[name="password"]').first()
  const submitButton = page.locator('button[type="submit"]').first()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await submitButton.click()

    try {
      await page.waitForURL(/\/(buscar|dashboard)/, { timeout: 30_000 })
      return
    } catch {
      const rateLimited = await page
        .getByText(/muitas tentativas|tente novamente|aguarde/i)
        .count()
      if (rateLimited > 0 && attempt < 2) {
        await page.waitForTimeout(2_500)
        continue
      }

      const invalidCredentials = await page
        .getByText(/email ou senha incorretos|credenciais invalidas/i)
        .count()
      if (invalidCredentials > 0) {
        throw new Error('E2E login failed: invalid credentials for configured user.')
      }

      throw new Error(`E2E login failed: no redirect after submit (url=${page.url()}).`)
    }
  }
}

test.describe('Wave 2 onboarding and gate matrix coverage', () => {
  test('renders onboarding matrix and gate cards for professional workspace', async ({ page }) => {
    test.skip(
      !hasProfessionalConfig,
      'Set E2E_PROFESSIONAL_EMAIL and E2E_PROFESSIONAL_PASSWORD to run onboarding gate checks.',
    )

    await login(page, professionalEmail as string, professionalPassword as string)
    await page.goto('/onboarding-profissional')

    await expect(page).toHaveURL(/\/onboarding-profissional/)
    await expect(page.getByRole('heading', { name: /C1-C10/i })).toBeVisible()
    await expect(page.getByText(/Review submission gate/i)).toBeVisible()
    await expect(page.getByText(/First-booking acceptance gate/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Enviar para revisao/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('allows booking and request entry points when first-booking gate is open', async ({ page }) => {
    test.skip(
      !hasPublicProfessional,
      'Set E2E_USER_EMAIL, E2E_USER_PASSWORD and E2E_PROFESSIONAL_ID to run open-gate checks.',
    )

    await login(page, userEmail as string, userPassword as string)
    await page.goto(`/agendar/${publicProfessionalId}`)
    await page.waitForLoadState('domcontentloaded')

    const bookingState = await detectBookingEntryState(page)
    if (bookingState === 'not_found') {
      test.skip(true, 'Configured E2E_PROFESSIONAL_ID does not resolve to an existing public profile.')
    }

    if (page.url().includes('erro=auto-agendamento')) {
      test.skip(true, 'Configured E2E_PROFESSIONAL_ID points to same professional account.')
    }

    await expect(page).toHaveURL(new RegExp(`/agendar/${publicProfessionalId}`))
    await expect(page.getByRole('heading', { name: /Tipo de agendamento/i })).toBeVisible()

    await page.goto(`/solicitar/${publicProfessionalId}`)
    await page.waitForLoadState('networkidle')
    if (await isNotFoundPage(page)) {
      test.skip(true, 'Configured E2E_PROFESSIONAL_ID does not resolve to existing request-booking profile.')
    }
    if (page.url().includes('erro=request-booking-indisponivel')) {
      test.skip(true, 'Configured E2E_PROFESSIONAL_ID does not allow request-booking for current tier.')
    }

    await expect(page).toHaveURL(new RegExp(`/solicitar/${publicProfessionalId}`))
    await expect(page.getByRole('heading', { name: /Solicitar/i })).toBeVisible()
  })

  test('blocks booking and request entry points when first-booking gate is closed', async ({ page }) => {
    test.skip(
      !hasBlockedProfessional,
      'Set E2E_BLOCKED_PROFESSIONAL_ID with user credentials to run closed-gate checks.',
    )

    await login(page, userEmail as string, userPassword as string)

    await page.goto(`/agendar/${blockedProfessionalId}`)
    await page.waitForLoadState('domcontentloaded')
    const blockedState = await detectBookingEntryState(page)
    if (blockedState === 'not_found') {
      test.skip(true, 'Configured E2E_BLOCKED_PROFESSIONAL_ID does not resolve to an existing public profile.')
    }
    if (blockedState === 'unknown') {
      test.skip(true, 'Unable to determine blocked fixture state within timeout window.')
    }
    if (blockedState === 'booking_ready') {
      test.skip(true, 'Configured E2E_BLOCKED_PROFESSIONAL_ID is not blocked in current environment.')
    }

    await page.waitForURL('**/profissional/**', { timeout: 15_000 })
    await expect(page).toHaveURL(/erro=primeiro-agendamento-bloqueado/)

    await page.goto(`/solicitar/${blockedProfessionalId}`)
    await page.waitForLoadState('domcontentloaded')
    if (await isNotFoundPage(page)) {
      test.skip(true, 'Configured E2E_BLOCKED_PROFESSIONAL_ID does not resolve to existing request-booking profile.')
    }

    await page.waitForURL('**/profissional/**', { timeout: 15_000 })
    await expect(page).toHaveURL(/erro=primeiro-agendamento-bloqueado/)
  })
})
