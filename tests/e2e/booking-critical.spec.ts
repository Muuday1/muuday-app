import { expect, test, type Page } from '@playwright/test'

const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD
const professionalId = process.env.E2E_PROFESSIONAL_ID
const manualProfessionalId = process.env.E2E_MANUAL_PROFESSIONAL_ID

const hasE2EConfig = Boolean(email && password && professionalId)
const hasManualConfirmationConfig = Boolean(email && password && manualProfessionalId)

async function login(page: Page) {
  await page.goto('/login')
  const acceptCookiesButton = page.getByRole('button', { name: 'Aceitar' }).first()
  await acceptCookiesButton.click({ timeout: 3_000 }).catch(() => {})
  await page.locator('#login-email, input[type="email"], input[name="email"]').first().fill(email || '')
  await page.locator('#login-password, input[type="password"], input[name="password"]').first().fill(password || '')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL('**/buscar')
}

async function openBookingPage(page: Page, targetProfessionalId: string) {
  await login(page)
  await page.goto(`/agendar/${targetProfessionalId}`)
  await page.waitForLoadState('domcontentloaded')

  for (let i = 0; i < 10; i += 1) {
    const currentUrl = page.url()
    if (currentUrl.includes(`/profissional/${targetProfessionalId}`)) {
      if (currentUrl.includes('erro=auto-agendamento')) {
        await expect(page.getByText(/possivel agendar sessao com voce mesmo/i)).toBeVisible()
      }
      return false
    }
    await page.waitForTimeout(200)
  }

  return true
}

test.describe('Booking critical journey', () => {
  test.skip(!hasE2EConfig, 'Set E2E_USER_EMAIL, E2E_USER_PASSWORD and E2E_PROFESSIONAL_ID to run e2e tests.')

  test('shows booking safety policy and timezone controls', async ({ page }) => {
    const openedBookingPage = await openBookingPage(page, professionalId as string)
    if (!openedBookingPage) test.skip(true, 'Configured E2E_PROFESSIONAL_ID points to the same logged-in professional.')

    await expect(page.getByRole('heading', { name: 'Tipo de agendamento' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver no meu fuso' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver no fuso do profissional' })).toBeVisible()
    await expect(page.getByText(/cancelamento/i).first()).toBeVisible()
    await expect(page.getByText(/reembolso/i).first()).toBeVisible()
  })

  test('keeps checkout blocked until cancellation and timezone confirmations are checked', async ({ page }) => {
    const openedBookingPage = await openBookingPage(page, professionalId as string)
    if (!openedBookingPage) test.skip(true, 'Configured E2E_PROFESSIONAL_ID points to the same logged-in professional.')

    const dateButton = page.locator('button[aria-label][aria-pressed=\"false\"]:not([disabled])').first()

    if ((await dateButton.count()) === 0) test.skip(true, 'No selectable date available for this professional.')

    await dateButton.click()

    const timeButton = page.getByRole('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()
    if ((await timeButton.count()) === 0) test.skip(true, 'No selectable time slot available.')

    await timeButton.click()

    const submitButton = page.getByRole('button', { name: /Pagar/ })
    await expect(submitButton).toBeDisabled()

    const purposeField = page.getByPlaceholder(
      /Descreva brevemente o que voce quer trabalhar nesta sessao|Descreva brevemente o que você quer trabalhar nesta sessão/i,
    )
    if ((await purposeField.count()) > 0) {
      await purposeField.fill('Teste E2E de validacao de formulario.')
    }

    const checkboxes = page.locator('input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()
    if (checkboxCount < 2) {
      test.skip(true, 'Booking page no longer exposes the two confirmation checkboxes in this flow.')
    }

    const policyCheckbox = checkboxes.nth(0)
    const timezoneCheckbox = checkboxes.nth(1)

    await policyCheckbox.check()
    await expect(submitButton).toBeDisabled()

    await timezoneCheckbox.check()
    await expect(submitButton).toBeEnabled()

    await policyCheckbox.uncheck()
    await expect(submitButton).toBeDisabled()
  })

  test('shows manual confirmation submit copy when professional requires approval', async ({ page }) => {
    test.skip(
      !hasManualConfirmationConfig,
      'Set E2E_MANUAL_PROFESSIONAL_ID with E2E_USER_EMAIL and E2E_USER_PASSWORD to validate manual confirmation mode.'
    )

    const openedBookingPage = await openBookingPage(page, manualProfessionalId as string)
    if (!openedBookingPage) test.skip(true, 'Configured E2E_MANUAL_PROFESSIONAL_ID points to the same logged-in professional.')

    await expect(page.getByRole('heading', { name: 'Tipo de agendamento' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Pagar .*solicitar/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Pagar .*confirmar/i })).toHaveCount(0)
  })
})
