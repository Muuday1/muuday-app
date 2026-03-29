const { expect, test } = require('@playwright/test')
const { loginWithPassword } = require('./helpers/auth')

test('agenda journey: open agenda page', async ({ page }) => {
  await loginWithPassword(page)
  await page.goto('/agenda')
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()
})

