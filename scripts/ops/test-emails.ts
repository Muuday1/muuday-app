/**
 * Test script — sends all email templates to a given address.
 * Run: npx tsx scripts/ops/test-emails.ts igopinto.lds@gmail.com
 */
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

// Re-import after env is loaded
async function main() {
  const to = process.argv[2] || 'igopinto.lds@gmail.com'
  console.log(`\nSending all test emails to: ${to}\n`)

  const {
    sendWelcomeEmail,
    sendCompleteAccountEmail,
    sendBookingConfirmationEmail,
    sendNewBookingToProfessionalEmail,
    sendSessionReminder24hEmail,
    sendSessionReminder1hEmail,
    sendBookingCancelledEmail,
    sendPaymentConfirmationEmail,
    sendPaymentFailedEmail,
    sendRefundEmail,
    sendNewReviewEmail,
    sendProfileApprovedEmail,
    sendProfileRejectedEmail,
    sendRequestReviewEmail,
    sendRescheduledEmail,
    sendWaitlistConfirmationEmail,
    sendWelcomeSeries1Email,
    sendWelcomeSeries2Email,
    sendWelcomeSeries3Email,
    sendReferralInviteEmail,
    sendFirstBookingNudgeEmail,
    sendReengagementEmail,
    sendLaunchEmail,
  } = await import('../../lib/email/resend')

  const emails: Array<{ name: string; fn: () => Promise<unknown> }> = [
    { name: '1. Boas-vindas',          fn: () => sendWelcomeEmail(to, 'Igor') },
    { name: '2. Completar conta',       fn: () => sendCompleteAccountEmail(to, 'Igor') },
    { name: '3. Confirmação agendamento', fn: () => sendBookingConfirmationEmail(to, 'Igor', 'Dra. Ana Lima', 'Terapia Individual', '15 de abril de 2026', '10:00', 'Europe/London') },
    { name: '4. Novo agendamento (profissional)', fn: () => sendNewBookingToProfessionalEmail(to, 'Dra. Ana Lima', 'Igor', 'Terapia Individual', '15 de abril de 2026', '10:00') },
    { name: '5. Lembrete 24h (usuário)', fn: () => sendSessionReminder24hEmail(to, 'Igor', 'Dra. Ana Lima', 'Terapia Individual', '15 de abril de 2026', '10:00', 'Europe/London') },
    { name: '6. Lembrete 1h (usuário)',  fn: () => sendSessionReminder1hEmail(to, 'Igor', 'Dra. Ana Lima', '10:00', 'Europe/London') },
    { name: '7. Cancelamento',          fn: () => sendBookingCancelledEmail(to, 'Igor', 'Dra. Ana Lima', '15 de abril de 2026', '10:00', 'user') },
    { name: '8. Confirmação pagamento', fn: () => sendPaymentConfirmationEmail(to, 'Igor', 'Dra. Ana Lima', 'Terapia Individual', '£120,00', '15 de abril de 2026') },
    { name: '9. Falha no pagamento',    fn: () => sendPaymentFailedEmail(to, 'Igor', 'Terapia Individual') },
    { name: '10. Reembolso',            fn: () => sendRefundEmail(to, 'Igor', '£120,00', 'Terapia Individual') },
    { name: '11. Nova avaliação',       fn: () => sendNewReviewEmail(to, 'Dra. Ana Lima', 'Igor', 5, 'Sessão incrível, muito profissional e atenciosa!') },
    { name: '12. Perfil aprovado',      fn: () => sendProfileApprovedEmail(to, 'Dra. Ana Lima') },
    { name: '13. Perfil rejeitado',     fn: () => sendProfileRejectedEmail(to, 'Dra. Ana Lima', 'Documentação profissional incompleta.') },
    { name: '14. Solicitar avaliação',  fn: () => sendRequestReviewEmail(to, 'Igor', 'Dra. Ana Lima', 'Terapia Individual') },
    { name: '15. Reagendamento',        fn: () => sendRescheduledEmail(to, 'Igor', 'Dra. Ana Lima', 'Terapia Individual', '15 de abril', '10:00', '17 de abril', '14:00', 'Europe/London', 'professional') },
    { name: '16. Confirmação waitlist', fn: () => sendWaitlistConfirmationEmail(to, 'Igor') },
    { name: '17. Série boas-vindas #1', fn: () => sendWelcomeSeries1Email(to, 'Igor') },
    { name: '18. Série boas-vindas #2', fn: () => sendWelcomeSeries2Email(to, 'Igor') },
    { name: '19. Série boas-vindas #3', fn: () => sendWelcomeSeries3Email(to, 'Igor') },
    { name: '20. Convite amigos',       fn: () => sendReferralInviteEmail(to, 'Igor', 'https://muuday.com/ref/igor123') },
    { name: '21. Nudge primeiro agendamento', fn: () => sendFirstBookingNudgeEmail(to, 'Igor') },
    { name: '22. Re-engajamento',       fn: () => sendReengagementEmail(to, 'Igor') },
    { name: '23. Email de lançamento',  fn: () => sendLaunchEmail(to, 'Igor') },
  ]

  let ok = 0
  let fail = 0

  for (const { name, fn } of emails) {
    try {
      await fn()
      console.log(`  ✅ ${name}`)
      ok++
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.log(`  ❌ ${name}: ${msg}`)
      fail++
    }
  }

  console.log(`\nDone: ${ok} sent, ${fail} failed.\n`)
}

main().catch(console.error)
