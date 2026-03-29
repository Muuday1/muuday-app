const { expect, test } = require('@playwright/test')
const { loginWithPassword } = require('./helpers/auth')

test('search-booking journey: open booking page and validate safety UI', async ({ page }) => {
  const professionalId = process.env.CHECKLY_BOOKING_PROFESSIONAL_ID
  if (!professionalId) {
    test.skip(true, 'Missing required env var: CHECKLY_BOOKING_PROFESSIONAL_ID')
  }

  await loginWithPassword(page)
  await page.goto(`/agendar/${professionalId}`)

  try {
    await page.waitForURL('**/profissional/**?erro=auto-agendamento', { timeout: 2500 })
    await expect(page.getByText('Nao e possivel agendar sessao com voce mesmo.')).toBeVisible()
    return
  } catch {
    // continue in booking page
  }

  if (await page.getByText('Nao e possivel agendar sessao com voce mesmo.').first().isVisible()) {
    return
  }

  await expect(page.getByRole('heading', { name: 'Tipo de agendamento' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ver no meu fuso' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ver no fuso do profissional' })).toBeVisible()
  await expect(page.getByText('Politica de cancelamento')).toBeVisible()
})
