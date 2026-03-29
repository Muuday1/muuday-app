const { expect, test } = require('@playwright/test')
const { loginWithPassword, toAppUrl } = require('./helpers/auth')

test('agenda journey: open agenda page', async ({ page }) => {
  await loginWithPassword(page)
  await page.goto(toAppUrl('/agenda'))
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()
})
