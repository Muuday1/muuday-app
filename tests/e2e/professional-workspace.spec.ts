import { expect, test, type Page } from '@playwright/test'

const userEmail = process.env.E2E_USER_EMAIL
const userPassword = process.env.E2E_USER_PASSWORD
const professionalEmail = process.env.E2E_PROFESSIONAL_EMAIL
const professionalPassword = process.env.E2E_PROFESSIONAL_PASSWORD

const hasUserConfig = Boolean(userEmail && userPassword)
const hasProfessionalConfig = Boolean(professionalEmail && professionalPassword)

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.getByRole('button', { name: 'Login' }).click()
  await page.waitForURL(/\/(buscar|dashboard)/)
}

test.describe('Professional workspace role split', () => {
  test.skip(!hasProfessionalConfig, 'Set E2E_PROFESSIONAL_EMAIL and E2E_PROFESSIONAL_PASSWORD to run professional workspace tests.')

  test('shows professional primary nav only', async ({ page }) => {
    await login(page, professionalEmail as string, professionalPassword as string)
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Calendario' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Financeiro' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Configuracoes' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Buscar' })).toHaveCount(0)
  })

  test('renders agenda control center views', async ({ page }) => {
    await login(page, professionalEmail as string, professionalPassword as string)
    await page.goto('/agenda?view=settings')

    await expect(page.locator('[data-testid="professional-agenda-view-switcher"]')).toBeVisible()
    await expect(page.locator('[data-testid="professional-calendar-control-center"]')).toBeVisible()

    await page.goto('/agenda?view=pending')
    await expect(page.locator('[data-testid="agenda-upcoming-section"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pendencias de confirmacao' })).toBeVisible()
  })

  test('renders business-oriented professional settings hub', async ({ page }) => {
    await login(page, professionalEmail as string, professionalPassword as string)
    await page.goto('/configuracoes')

    await expect(page.getByRole('heading', { name: 'Configuracoes do negocio' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Perfil e servicos/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Calendario', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /Regras de booking/i })).toBeVisible()
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
})
