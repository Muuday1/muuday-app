const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function envFrom(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const raw of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    out[line.slice(0, i)] = line.slice(i + 1).replace(/^"|"$/g, '');
  }
  return out;
}

(async () => {
  const env = { ...envFrom(path.join(process.cwd(), '.env.local')), ...process.env };
  const email = env.E2E_PROFESSIONAL_EMAIL;
  const password = env.E2E_PROFESSIONAL_PASSWORD;
  const baseURL = 'https://muuday-39s33o7rc-muuday1s-projects.vercel.app';
  const result = { login: 'pending', identitySave: 'pending', availabilitySave: 'pending', errors: [] };
  if (!email || !password) throw new Error('Missing E2E professional credentials');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Aceitar/i }).first().click({ timeout: 2000 }).catch(() => {});
    await page.locator('#login-email, input[type="email"], input[name="email"]').first().fill(email);
    await page.locator('#login-password, input[type="password"], input[name="password"]').first().fill(password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/dashboard|\/buscar-auth/, { timeout: 45000 });
    if (!page.url().includes('/dashboard')) await page.goto(`${baseURL}/dashboard`);
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    result.login = 'ok';

    await page.getByRole('button', { name: /Abrir tracker de onboarding|Continuar onboarding/i }).first().click({ timeout: 15000 });
    const modal = page.getByRole('dialog', { name: /Tracker de onboarding profissional/i });
    await modal.waitFor({ state: 'visible', timeout: 15000 });

    await modal.getByRole('button', { name: /Identidade/i }).first().click().catch(() => {});
    const fileInput = modal.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(process.cwd(), 'public', 'assets', 'marketing', 'professionals', 'hero-main.webp')).catch(() => {});

    const idRespPromise = page.waitForResponse(r => r.url().includes('/api/professional/onboarding/save') && r.request().method() === 'POST', { timeout: 30000 });
    await modal.getByRole('button', { name: /Salvar identidade e perfil/i }).first().click({ timeout: 10000 });
    const idResp = await idRespPromise;
    result.identitySave = idResp.status() === 200 ? 'ok' : `fail_${idResp.status()}`;
    if (idResp.status() !== 200) result.errors.push(await idResp.text());

    await modal.getByRole('button', { name: /Disponibilidade/i }).first().click({ timeout: 10000 });
    await modal.locator('input[type="checkbox"]').first().check({ force: true }).catch(() => {});
    const avRespPromise = page.waitForResponse(r => r.url().includes('/api/professional/onboarding/save') && r.request().method() === 'POST', { timeout: 30000 });
    await modal.getByRole('button', { name: /Salvar horas de trabalho/i }).first().click({ timeout: 10000 });
    const avResp = await avRespPromise;
    result.availabilitySave = avResp.status() === 200 ? 'ok' : `fail_${avResp.status()}`;
    if (avResp.status() !== 200) result.errors.push(await avResp.text());

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
})();
