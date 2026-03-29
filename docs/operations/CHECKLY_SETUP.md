# Checkly Setup (Production)

Este guia cria monitoramento para os endpoints de cron e disponibilidade bÃ¡sica.

## 1) Preparar variÃ¡veis no Checkly

1. Abra o dashboard do Checkly.
2. Entre em **Variables** (ou **Environment Variables**).
3. Crie:
   - `BASE_URL` = `https://muuday-app.vercel.app`
   - `CRON_SECRET` = seu valor real de `CRON_SECRET`
4. Marque `CRON_SECRET` como secreto.

Quando migrar para domÃ­nio final, troque apenas `BASE_URL`.

## 2) Criar check: booking-reminders

1. Clique em **New Check** -> **API Check**.
2. Nome: `prod-booking-reminders`.
3. Method: `GET`.
4. URL: `{{BASE_URL}}/api/cron/booking-reminders`.
5. Headers:
   - `x-cron-secret: {{CRON_SECRET}}`
6. Assertions:
   - Status code = `200`
   - Response body contains `"ok":true`
7. Frequency: a cada **5 minutos**.
8. Retries: **2**.
9. Timeout: **20s**.
10. Salve.

## 3) Criar check: booking-timeouts

1. Clique em **New Check** -> **API Check**.
2. Nome: `prod-booking-timeouts`.
3. Method: `GET`.
4. URL: `{{BASE_URL}}/api/cron/booking-timeouts`.
5. Headers:
   - `x-cron-secret: {{CRON_SECRET}}`
6. Assertions:
   - Status code = `200`
   - Response body contains `"ok":true`
7. Frequency: a cada **15 minutos**.
8. Retries: **2**.
9. Timeout: **20s**.
10. Salve.

## 4) Criar check de disponibilidade web

1. **New Check** -> **API Check** (ou Browser Check, se preferir).
2. Nome: `prod-home-availability`.
3. Method: `GET`.
4. URL: `{{BASE_URL}}/login`.
5. Assertions:
   - Status code = `200`
   - Response body contains `Muuday` (ou outro texto estÃ¡vel da pÃ¡gina)
6. Frequency: a cada **5 minutos**.

## 5) Alertas

1. Em **Alert Channels**, conecte Email/Slack.
2. No check, habilite alertas:
   - Alertar quando falhar em 2 execuÃ§Ãµes seguidas.
   - Alertar recuperaÃ§Ã£o (quando voltar ao normal).

## 6) ManutenÃ§Ã£o segura

Antes de mudanÃ§as grandes/deploy:

1. Pause temporariamente os checks de cron (opcional).
2. FaÃ§a deploy.
3. Rode smoke test manual dos endpoints.
4. Reative checks.

## 7) Troca de domÃ­nio (sem retrabalho)

Quando migrar para `muuday.com`:

1. Atualize `BASE_URL` no Checkly.
2. NÃ£o recrie checks.
3. Rode um **retest** manual em cada check.
