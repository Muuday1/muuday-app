const { expect, test } = require('@playwright/test')
const { loginWithPassword } = require('./helpers/auth')

test('auth journey: login and reach search page', async ({ page }) => {
  await loginWithPassword(page)
  await expect(page.getByRole('heading', { name: 'Buscar profissionais' })).toBeVisible()
})

