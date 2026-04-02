import { expect, test, type Page } from '@playwright/test'

const userEmail = process.env.E2E_USER_EMAIL
const userPassword = process.env.E2E_USER_PASSWORD
const professionalEmail = process.env.E2E_PROFESSIONAL_EMAIL
const professionalPassword = process.env.E2E_PROFESSIONAL_PASSWORD
const adminEmail = process.env.E2E_ADMIN_EMAIL || process.env.E2E_USER_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_USER_PASSWORD
const bookableProfessionalId = process.env.E2E_PROFESSIONAL_ID

const hasUserConfig = Boolean(userEmail && userPassword)
const hasProfessionalConfig = Boolean(professionalEmail && professionalPassword)
const hasAdminConfig = Boolean(adminEmail && adminPassword)
const hasBookableProfessional = Boolean(bookableProfessionalId)

async function dismissCookieDialogIfPresent(page: Page) {
  const acceptButton = page.getByRole('button', { name: /Aceitar/i }).first()
  await acceptButton.click({ timeout: 2_000 }).catch(() => {})

  const closeButton = page.getByRole('button', { name: /Fechar/i }).first()
  await closeButton.click({ timeout: 1_000 }).catch(() => {})

  const cookieBackdropClose = page
    .locator('[role=\"dialog\"][aria-label*=\"cookies\" i] button[aria-label=\"Fechar\"]')
    .first()
  await cookieBackdropClose.click({ timeout: 1_000 }).catch(() => {})
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await dismissCookieDialogIfPresent(page)
  const emailInput = page.locator('#login-email, input[type="email"], input[name="email"]').first()
  const passwordInput = page.locator('#login-password, input[type="password"], input[name="password"]').first()
  const submitButton = page.locator('button[type="submit"]').first()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await dismissCookieDialogIfPresent(page)
    await emailInput.fill(email)
    await passwordInput.fill(password)
    await submitButton.click().catch(async () => {
      await dismissCookieDialogIfPresent(page)
      await submitButton.click()
    })

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

test.describe('Professional workspace role split', () => {
  test.skip(!hasProfessionalConfig, 'Set E2E_PROFESSIONAL_EMAIL and E2E_PROFESSIONAL_PASSWORD to run professional workspace tests.')

  test('shows professional primary nav only', async ({ page }) => {
    await login(page, professionalEmail as string, professionalPassword as string)
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('a[href="/dashboard"]').first()).toBeVisible()
    await expect(page.locator('a[href="/agenda"]').first()).toBeVisible()
    await expect(page.locator('a[href="/financeiro"]').first()).toBeVisible()
    await expect(page.locator('a[href="/configuracoes"]').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Buscar' })).toHaveCount(0)
  })

  test('renders agenda control center views', async ({ page }) => {
    await login(page, professionalEmail as string, professionalPassword as string)
    await page.goto('/agenda?view=settings')

    await expect(page.locator('[data-testid="professional-agenda-view-switcher"]')).toBeVisible()
    await expect(page.locator('[data-testid="professional-calendar-control-center"]')).toBeVisible()

    await page.goto('/agenda?view=pending')
    await expect(page.locator('[data-testid="agenda-upcoming-section"]')).toBeVisible()
    await expect(page).toHaveURL(/\/agenda\?view=pending/)
  })

  test('renders business-oriented professional settings hub', async ({ page }) => {
    await login(page, professionalEmail as string, professionalPassword as string)
    await page.goto('/configuracoes')

    await expect(page).toHaveURL(/\/configuracoes/)
    await expect(page.getByRole('heading', { name: /Configura/i })).toBeVisible()
    await expect(page.locator('a[href="/editar-perfil-profissional"]').first()).toBeVisible()
    await expect(page.locator('a[href="/disponibilidade"]').first()).toBeVisible()
    await expect(page.locator('a[href="/configuracoes-agendamento"]').first()).toBeVisible()
  })
})

test.describe('Role guard integrity', () => {
  test.skip(!hasUserConfig, 'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run user-role guard tests.')

  test('redirects user role away from professional dashboard', async ({ page }) => {
    await login(page, userEmail as string, userPassword as string)
    await page.goto('/dashboard')
    await page.waitForURL('**/buscar')
    await expect(page).toHaveURL(/\/buscar/)
  })

  test('redirects professional away from user-only favorites', async ({ page }) => {
    test.skip(
      !hasProfessionalConfig,
      'Set E2E_PROFESSIONAL_EMAIL and E2E_PROFESSIONAL_PASSWORD to run professional guard tests.',
    )
    await login(page, professionalEmail as string, professionalPassword as string)
    await page.goto('/favoritos')
    await page.waitForURL('**/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('blocks professional from agendar e solicitar flow', async ({ page }) => {
    test.skip(
      !hasProfessionalConfig || !hasBookableProfessional,
      'Set E2E_PROFESSIONAL_EMAIL, E2E_PROFESSIONAL_PASSWORD and E2E_PROFESSIONAL_ID to run booking guard tests.',
    )

    await login(page, professionalEmail as string, professionalPassword as string)

    await page.goto(`/agendar/${bookableProfessionalId}`)
    await page.waitForURL('**/dashboard**')
    await expect(page).toHaveURL(/\/dashboard/)

    await page.goto(`/solicitar/${bookableProfessionalId}`)
    await page.waitForURL('**/dashboard**')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('keeps admin in search area and blocks professional dashboard', async ({ page }) => {
    test.skip(!hasAdminConfig, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin guard tests.')
    await login(page, adminEmail as string, adminPassword as string)
    await expect(page).toHaveURL(/\/buscar/)

    await page.goto('/dashboard')
    await page.waitForURL('**/buscar')
    await expect(page).toHaveURL(/\/buscar/)
  })
})
