import { expect, test, type Page } from '@playwright/test'

const email = process.env.E2E_USER_EMAIL
const password = process.env.E2E_USER_PASSWORD
const professionalId = process.env.E2E_PROFESSIONAL_ID

const hasE2EConfig = Boolean(email && password && professionalId)

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email || '')
  await page.getByLabel('Senha').fill(password || '')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL('**/buscar')
}

test.describe('Booking critical journey', () => {
  test.skip(!hasE2EConfig, 'Set E2E_USER_EMAIL, E2E_USER_PASSWORD and E2E_PROFESSIONAL_ID to run e2e tests.')

  test('shows booking safety policy and timezone controls', async ({ page }) => {
    await login(page)
    await page.goto(`/agendar/${professionalId}`)

    await expect(page.getByRole('heading', { name: 'Tipo de agendamento' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver no meu fuso' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver no fuso do profissional' })).toBeVisible()
    await expect(page.getByText('Politica de cancelamento')).toBeVisible()
    await expect(page.getByText('Cancelamento com 48h ou mais: reembolso de 100%')).toBeVisible()
  })

  test('keeps checkout button blocked until required confirmations', async ({ page }) => {
    await login(page)
    await page.goto(`/agendar/${professionalId}`)

    const dateButton = page.locator('button:has(span.bg-brand-400)').first()

    if ((await dateButton.count()) === 0) test.skip(true, 'No selectable date available for this professional.')

    await dateButton.click()

    const timeButton = page.getByRole('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()
    if ((await timeButton.count()) === 0) test.skip(true, 'No selectable time slot available.')

    await timeButton.click()

    const submitButton = page.getByRole('button', { name: /Pagar/ })
    await expect(submitButton).toBeDisabled()

    const purposeLabel = page.getByText(/Objetivo da sessao/)
    await expect(purposeLabel).toBeVisible()

    const requiredPurpose = await page.getByText('(obrigatorio)').count()
    if (requiredPurpose > 0) {
      await page.getByPlaceholder('Descreva brevemente o que voce quer trabalhar nesta sessao.').fill('Teste E2E de validacao de formulario.')
    }

    await page.getByText('Li e concordo com a politica de cancelamento e reembolso.').click()
    await page.getByText('Confirmo que revisei data e horario nos fusos corretos.').click()

    await expect(submitButton).toBeEnabled()
  })
})
