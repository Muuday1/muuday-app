const { expect, test } = require('@playwright/test')

function resolveBaseUrl() {
  const base = (process.env.BASE_URL || process.env.CHECKLY_BASE_URL || '').trim()
  if (!base) return ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

function toAppUrl(pathname) {
  if (/^https?:\/\//i.test(pathname)) return pathname
  const base = resolveBaseUrl()
  if (!base) return pathname
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${normalizedPath}`
}

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

  await page.goto(toAppUrl('/login'))
  await page.locator('input[type="email"]').first().fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/buscar/)
}

module.exports = { loginWithPassword, toAppUrl }
