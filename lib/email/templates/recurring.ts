import { sendEmail } from '@/lib/email/client'
import { emailLayout, infoBox, cta, signoff, from } from '@/lib/email/theme'
import { APP_URL } from '@/lib/email/theme'

export async function sendRenewalReminderEmail(
  to: string,
  name: string,
  professionalName: string,
  renewalDate: string,
  amount: string,
  groupId: string,
) {
  return sendEmail({
    from: from(),
    to,
    subject: 'Sua renovação automática está próxima 🔄',
    html: emailLayout(
      'Renovação',
      'Renovação automática em 7 dias',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Seu ciclo de sessões com <strong>${professionalName}</strong> está chegando ao fim. A renovação automática está <strong>ativa</strong> e seu cartão será cobrado em <strong>${renewalDate}</strong>.</p>
      ${infoBox([
        { label: '👤 Profissional', value: professionalName },
        { label: '💳 Valor', value: amount },
        { label: '📅 Próxima cobrança', value: renewalDate },
      ])}
      <p class="bt">Caso queira desativar a renovação automática, você pode fazer isso a qualquer momento.</p>
      ${cta(`${APP_URL}/agenda/recorrente/${groupId}/configuracoes`, 'Gerenciar renovação →')}
      ${signoff()}`,
    ),
  })
}

export async function sendRenewalSuccessEmail(
  to: string,
  name: string,
  professionalName: string,
  cycleDates: string,
  amount: string,
) {
  return sendEmail({
    from: from(),
    to,
    subject: 'Renovação confirmada ✅',
    html: emailLayout(
      'Renovação',
      'Novo ciclo confirmado!',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">A renovação do seu ciclo de sessões com <strong>${professionalName}</strong> foi confirmada com sucesso.</p>
      ${infoBox([
        { label: '👤 Profissional', value: professionalName },
        { label: '📅 Novo ciclo', value: cycleDates },
        { label: '💳 Valor cobrado', value: amount },
      ])}
      <div class="success"><p>✅ Pagamento confirmado e sessões reservadas.</p></div>
      ${cta(`${APP_URL}/agenda`, 'Ver meus agendamentos →')}
      ${signoff()}`,
    ),
  })
}

export async function sendRenewalFailedEmail(
  to: string,
  name: string,
  professionalName: string,
  amount: string,
  groupId: string,
) {
  return sendEmail({
    from: from(),
    to,
    subject: 'Falha na renovação automática — ação necessária ⚠️',
    html: emailLayout(
      'Renovação',
      'Renovação automática pausada',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Não foi possível renovar automaticamente seu ciclo de sessões com <strong>${professionalName}</strong>. A renovação automática foi <strong>pausada</strong> para evitar novas tentativas.</p>
      ${infoBox([
        { label: '👤 Profissional', value: professionalName },
        { label: '💳 Valor', value: amount },
      ])}
      <div class="warn"><p>⚠️ Para continuar com as sessões, realize o pagamento manualmente.</p></div>
      ${cta(`${APP_URL}/agenda/recorrente/${groupId}/configuracoes`, 'Pagar manualmente →')}
      ${signoff()}`,
    ),
  })
}
