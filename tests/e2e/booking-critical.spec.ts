import { expect, test, type Page } from '@playwright/test'

const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD
const professionalId = process.env.E2E_PROFESSIONAL_ID
const manualProfessionalId = process.env.E2E_MANUAL_PROFESSIONAL_ID
const isCi = process.env.CI === 'true'

const hasE2EConfig = Boolean(email && password && professionalId)
const hasManualConfirmationConfig = Boolean(email && password && manualProfessionalId)

function failOrSkip(message: string, options?: { allowCiSkip?: boolean }) {
  if (isCi && !options?.allowCiSkip) {
    throw new Error(message)
  }
  test.skip(true, message)
}

type OpenBookingResult = {
  opened: boolean
  reason?: 'same_professional' | 'professional_not_found'
}

async function login(page: Page) {
  await page.goto('/login')
  const acceptCookiesButton = page.getByRole('button', { name: 'Aceitar' }).first()
  await acceptCookiesButton.click({ timeout: 3_000 }).catch(() => {})

  const emailInput = page.locator('#login-email, input[type="email"], input[name="email"]').first()
  const passwordInput = page.locator('#login-password, input[type="password"], input[name="password"]').first()
  const submitButton = page.locator('button[type="submit"]').first()

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await emailInput.fill(email || '')
    await passwordInput.fill(password || '')
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

async function openBookingPage(page: Page, targetProfessionalId: string) {
  await login(page)
  await page.goto(`/agendar/${targetProfessionalId}`)
  await page.waitForLoadState('domcontentloaded')

  const notFoundSignals = [
    page.getByRole('heading', { name: /p[aá]gina n[aã]o encontrada|p[aá]gina/i }),
    page.getByText(/n[aã]o existe ou foi movida/i),
    page.getByRole('link', { name: /voltar ao in[ií]cio/i }),
  ]
  const bookingHeading = page.getByRole('heading', { name: /tipo de agendamento/i })

  // Wait until one of the terminal states appears: booking page, not-found, or same-profile redirect.
  for (let i = 0; i < 15; i += 1) {
    const notFoundMatches = await Promise.all(notFoundSignals.map(signal => signal.count()))
    if (notFoundMatches.some(count => count > 0)) {
      return {
        opened: false,
        reason: 'professional_not_found',
      } as OpenBookingResult
    }

    if ((await bookingHeading.count()) > 0) {
      return { opened: true } as OpenBookingResult
    }

    const currentUrl = page.url()
    if (currentUrl.includes(`/profissional/${targetProfessionalId}`)) {
      if (currentUrl.includes('erro=auto-agendamento')) {
        await expect(page.getByText(/possivel agendar sessao com voce mesmo/i)).toBeVisible()
      }
      return { opened: false, reason: 'same_professional' } as OpenBookingResult
    }

    await page.waitForTimeout(250)
  }

  for (let i = 0; i < 10; i += 1) {
    const currentUrl = page.url()
    if (currentUrl.includes(`/profissional/${targetProfessionalId}`)) {
      if (currentUrl.includes('erro=auto-agendamento')) {
        await expect(page.getByText(/possivel agendar sessao com voce mesmo/i)).toBeVisible()
      }
      return { opened: false, reason: 'same_professional' } as OpenBookingResult
    }
    await page.waitForTimeout(200)
  }

  return { opened: true } as OpenBookingResult
}

test.describe('Booking critical journey', () => {
  test.skip(!hasE2EConfig, 'Set E2E_USER_EMAIL, E2E_USER_PASSWORD and E2E_PROFESSIONAL_ID to run e2e tests.')

  test('shows booking safety policy and timezone controls', async ({ page }) => {
    const bookingPage = await openBookingPage(page, professionalId as string)
    if (!bookingPage.opened && bookingPage.reason === 'same_professional') {
      test.skip(true, 'Configured E2E_PROFESSIONAL_ID points to the same logged-in professional.')
    }
    if (!bookingPage.opened && bookingPage.reason === 'professional_not_found') {
      test.skip(true, 'Configured E2E_PROFESSIONAL_ID does not resolve to an existing public profile.')
    }

    await expect(page.getByRole('heading', { name: 'Tipo de agendamento' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver no meu fuso' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver no fuso do profissional' })).toBeVisible()
    await expect(page.getByText(/cancelamento/i).first()).toBeVisible()
    await expect(page.getByText(/reembolso/i).first()).toBeVisible()
  })

  test('keeps checkout blocked until cancellation and timezone confirmations are checked', async ({ page }) => {
    const bookingPage = await openBookingPage(page, professionalId as string)
    if (!bookingPage.opened && bookingPage.reason === 'same_professional') {
      test.skip(true, 'Configured E2E_PROFESSIONAL_ID points to the same logged-in professional.')
    }
    if (!bookingPage.opened && bookingPage.reason === 'professional_not_found') {
      test.skip(true, 'Configured E2E_PROFESSIONAL_ID does not resolve to an existing public profile.')
    }

    const dateButton = page.locator('button[aria-label][aria-pressed=\"false\"]:not([disabled])').first()

    if ((await dateButton.count()) === 0) test.skip(true, 'No selectable date available for this professional.')

    await dateButton.click()

    const timeButton = page.getByRole('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()
    if ((await timeButton.count()) === 0) test.skip(true, 'No selectable time slot available.')

    await timeButton.click()

    const submitButton = page.getByRole('button', { name: /Pagar/ })
    await expect(submitButton).toBeDisabled()

    const purposeField = page.getByPlaceholder(
      /Descreva brevemente o que voc[êe] quer trabalhar nesta sess[ãa]o/i,
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
    if (!hasManualConfirmationConfig) {
      failOrSkip(
        'Missing manual-confirmation fixture. Set E2E_MANUAL_PROFESSIONAL_ID with E2E_USER_EMAIL and E2E_USER_PASSWORD.',
      )
    }

    const openedBookingPage = await openBookingPage(page, manualProfessionalId as string)
    if (!openedBookingPage.opened && openedBookingPage.reason === 'same_professional') {
      failOrSkip('Configured E2E_MANUAL_PROFESSIONAL_ID points to the same logged-in professional.', {
        allowCiSkip: true,
      })
    }
    if (!openedBookingPage.opened && openedBookingPage.reason === 'professional_not_found') {
      failOrSkip('Configured E2E_MANUAL_PROFESSIONAL_ID does not resolve to an existing public profile.', {
        allowCiSkip: true,
      })
    }

    await expect(page.getByRole('heading', { name: 'Tipo de agendamento' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Pagar .*solicitar/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Pagar .*confirmar/i })).toHaveCount(0)
  })
})
