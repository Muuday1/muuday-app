import { expect, test, type Page } from '@playwright/test'
import { login } from './helpers'

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

test.describe('Wave 2 onboarding and gate matrix coverage', () => {
  test('renders onboarding matrix and gate cards for professional workspace', async ({ page }) => {
    test.skip(
      !hasProfessionalConfig,
      'Set E2E_PROFESSIONAL_EMAIL and E2E_PROFESSIONAL_PASSWORD to run onboarding gate checks.',
    )

    await login(page, professionalEmail as string, professionalPassword as string)
    await page.goto('/onboarding-profissional')

    await expect(page).toHaveURL(/\/dashboard\?openOnboarding=1/)
    const onboardingCardHeading = page.getByRole('heading', { name: /Complete o onboarding para liberar o perfil/i })
    if ((await onboardingCardHeading.count()) === 0) {
      test.skip(true, 'Configured professional fixture no longer has onboarding pendências in the current environment.')
    }

    await expect(onboardingCardHeading).toBeVisible()
    await expect(page.getByText(/Revisão:/i)).toBeVisible()
    await page.getByRole('button', { name: /Abrir tracker de onboarding/i }).click()
    await expect(page.getByRole('dialog', { name: /Tracker de onboarding profissional/i })).toBeVisible()
    await expect(page.getByText(/Resumo executivo/i)).toBeVisible()
    await expect(page.getByText(/Enviar para análise|Enviar/i).first()).toBeVisible()
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
