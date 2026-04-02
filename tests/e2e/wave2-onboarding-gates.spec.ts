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

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  const acceptCookiesButton = page.getByRole('button', { name: 'Aceitar' }).first()
  await acceptCookiesButton.click({ timeout: 3_000 }).catch(() => {})
  await page.locator('#login-email, input[type="email"], input[name="email"]').first().fill(email)
  await page.locator('#login-password, input[type="password"], input[name="password"]').first().fill(password)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL(/\/(buscar|dashboard)/)
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

    if (page.url().includes('erro=auto-agendamento')) {
      test.skip(true, 'Configured E2E_PROFESSIONAL_ID points to same professional account.')
    }

    await expect(page).toHaveURL(new RegExp(`/agendar/${publicProfessionalId}`))
    await expect(page.getByRole('heading', { name: /Tipo de agendamento/i })).toBeVisible()

    await page.goto(`/solicitar/${publicProfessionalId}`)
    await page.waitForLoadState('networkidle')
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
    await page.waitForURL('**/profissional/**')
    await expect(page).toHaveURL(/erro=primeiro-agendamento-bloqueado/)

    await page.goto(`/solicitar/${blockedProfessionalId}`)
    await page.waitForURL('**/profissional/**')
    await expect(page).toHaveURL(/erro=primeiro-agendamento-bloqueado/)
  })
})
