import { sendEmail } from '@/lib/email/client'
import { emailLayout, cta, signoff, from, infoBox } from '@/lib/email/theme'
import { APP_URL } from '@/lib/email/theme'
import { formatMinorUnits } from '@/lib/payments/format-utils'

// ─── 20. Pagamento enviado (profissional) ─────────────────────────────────
export async function sendPayoutSentEmail(
  to: string,
  professionalName: string,
  params: {
    amount: bigint
    debtDeducted: bigint
    netAmount: bigint
    payoutBatchId: string
    expectedArrival?: string
  },
) {
  const { amount, debtDeducted, netAmount, expectedArrival } = params

  const rows: { label: string; value: string }[] = [
    { label: 'Valor bruto', value: formatMinorUnits(amount) },
  ]

  if (debtDeducted > BigInt(0)) {
    rows.push({ label: 'Dívida deduzida', value: `− ${formatMinorUnits(debtDeducted)}` })
  }

  rows.push({ label: 'Taxa de transferência', value: 'Gratuita (cortesia Muuday)' })
  rows.push({ label: 'Você recebe', value: formatMinorUnits(netAmount) })

  const arrivalText = expectedArrival
    ? `<p class="bt">O valor deve chegar até <strong>${expectedArrival}</strong>, dependendo do processamento do PayPal.</p>`
    : `<p class="bt">O valor deve chegar em até <strong>3 dias úteis</strong>, dependendo do processamento do PayPal.</p>`

  return sendEmail({
    from: from(),
    to,
    subject: `Seu pagamento foi enviado! 💸`,
    html: emailLayout(
      'Pagamento',
      'Seu pagamento foi enviado!',
      `<p class="greet">Oi, ${professionalName}!</p>
      <p class="bt">Acabamos de enviar seu pagamento semanal. Aqui estão os detalhes:</p>
      ${infoBox(rows)}
      ${arrivalText}
      <div class="success">
        <p>✅ Nenhuma taxa foi descontada do seu pagamento. A Muuday absorveu o custo da transferência.</p>
      </div>
      ${cta(`${APP_URL}/financeiro`, 'Ver no dashboard →')}
      ${signoff()}`,
    ),
  })
}

// ─── 21. Pagamento concluído (profissional) ────────────────────────────────
export async function sendPayoutCompletedEmail(
  to: string,
  professionalName: string,
  params: {
    netAmount: bigint
    payoutBatchId: string
  },
) {
  const { netAmount } = params

  return sendEmail({
    from: from(),
    to,
    subject: `Seu pagamento foi concluído! ✅`,
    html: emailLayout(
      'Concluído',
      'Pagamento concluído!',
      `<p class="greet">Oi, ${professionalName}!</p>
      <p class="bt">Boas notícias: seu pagamento de <strong>${formatMinorUnits(netAmount)}</strong> foi processado com sucesso e já está disponível na sua conta PayPal.</p>
      <div class="success">
        <p>✅ Pagamento concluído. Obrigado por fazer parte da Muuday!</p>
      </div>
      ${cta(`${APP_URL}/financeiro`, 'Ver histórico →')}
      ${signoff()}`,
    ),
  })
}

// ─── 22. Pagamento falhou (profissional) ───────────────────────────────────
export async function sendPayoutFailedEmail(
  to: string,
  professionalName: string,
  params: {
    netAmount: bigint
    payoutBatchId: string
    reason?: string
  },
) {
  const { netAmount, reason } = params

  return sendEmail({
    from: from(),
    to,
    subject: `Seu pagamento precisa de atenção ⚠️`,
    html: emailLayout(
      'Atenção',
      'Seu pagamento precisa de atenção',
      `<p class="greet">Oi, ${professionalName}!</p>
      <p class="bt">Infelizmente houve um problema ao processar seu pagamento de <strong>${formatMinorUnits(netAmount)}</strong>.</p>
      ${reason ? `<div class="warn"><p>Motivo: ${reason}</p></div>` : ''}
      <p class="bt">Nossa equipe já foi notificada e vai resolver isso o mais rápido possível. O valor foi devolvido ao seu saldo na Muuday e será incluído no próximo pagamento.</p>
      ${cta(`${APP_URL}/financeiro`, 'Ver no dashboard →')}
      ${signoff()}`,
    ),
  })
}
