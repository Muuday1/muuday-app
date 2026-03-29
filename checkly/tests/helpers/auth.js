const { expect, test } = require('@playwright/test')

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    test.skip(true, `Missing required env var: ${name}`)
  }
  return value || ''
}

async function loginWithPassword(page) {
  const email = requiredEnv('CHECKLY_USER_EMAIL')
  const password = requiredEnv('CHECKLY_USER_PASSWORD')

  await page.goto('/login')
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/buscar/)
}

module.exports = { loginWithPassword }

