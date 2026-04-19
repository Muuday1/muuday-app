import { sendEmail } from '@/lib/email/client'
import { emailLayout, infoBox, cta, signoff, from } from '@/lib/email/theme'
import { APP_URL } from '@/lib/email/theme'

// ─── 3. Confirmação de agendamento (usuário) ──────────────────────────────
export async function sendBookingConfirmationEmail(
  to: string, name: string,
  professionalName: string, service: string,
  date: string, time: string, timezone: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Sessão confirmada com ${professionalName} ✅`,
    html: emailLayout(
      'Agendamento',
      'Sessão confirmada! ✅',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Sua sessão com <strong>${professionalName}</strong> está confirmada. Veja os detalhes abaixo:</p>
      ${infoBox([
        { label: '👤 Profissional', value: professionalName },
        { label: '🎯 Serviço', value: service },
        { label: '📅 Data', value: date },
        { label: '🕐 Horário', value: `${time} (${timezone})` },
      ])}
      <p class="bt" style="font-size:13px;">Você receberá um lembrete 24h antes da sessão. Caso precise cancelar, faça com pelo menos 24h de antecedência.</p>
      ${cta(`${APP_URL}/agenda`, 'Ver meus agendamentos →')}
      ${signoff()}`
    ),
  })
}

// ─── 4. Novo agendamento recebido (profissional) ──────────────────────────
export async function sendNewBookingToProfessionalEmail(
  to: string, professionalName: string,
  clientName: string, service: string,
  date: string, time: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Novo agendamento: ${clientName} reservou uma sessão 📅`,
    html: emailLayout(
      'Nova sessão',
      'Você tem um novo agendamento! 📅',
      `<p class="greet">Olá, ${professionalName}!</p>
      <p class="bt"><strong>${clientName}</strong> acabou de agendar uma sessão com você.</p>
      ${infoBox([
        { label: '👤 Cliente', value: clientName },
        { label: '🎯 Serviço', value: service },
        { label: '📅 Data', value: date },
        { label: '🕐 Horário', value: time },
      ])}
      ${cta(`${APP_URL}/profissional/agenda`, 'Ver minha agenda →')}
      ${signoff()}`
    ),
  })
}

// ─── 5. Lembrete 24h antes (usuário) ──────────────────────────────────────
export async function sendSessionReminder24hEmail(
  to: string, name: string,
  professionalName: string, service: string,
  date: string, time: string, timezone: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Lembrete: sua sessão com ${professionalName} é amanhã ⏰`,
    html: emailLayout(
      'Lembrete',
      'Sua sessão é amanhã. ⏰',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Não esqueça — você tem uma sessão com <strong>${professionalName}</strong> amanhã.</p>
      ${infoBox([
        { label: '👤 Profissional', value: professionalName },
        { label: '🎯 Serviço', value: service },
        { label: '📅 Data', value: date },
        { label: '🕐 Horário', value: `${time} (${timezone})` },
      ])}
      <div class="hbox"><p>Precisa cancelar ou reagendar? Faça pelo painel com pelo menos 24h de antecedência.</p></div>
      ${cta(`${APP_URL}/agenda`, 'Ver detalhes →')}
      ${signoff()}`
    ),
  })
}

// ─── 6. Lembrete 1h antes (usuário) ───────────────────────────────────────
export async function sendSessionReminder1hEmail(
  to: string, name: string,
  professionalName: string, time: string, timezone: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Sua sessão começa em 1 hora! 🚀`,
    html: emailLayout(
      'Agora',
      'Começa em 1 hora. 🚀',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Sua sessão com <strong>${professionalName}</strong> começa às <strong>${time} (${timezone})</strong>.</p>
      <div class="success"><p>✅ Certifique-se de estar em um local tranquilo e com boa conexão à internet.</p></div>
      ${cta(`${APP_URL}/agenda`, 'Acessar sessão →')}
      ${signoff()}`
    ),
  })
}

// ─── 7. Lembrete 24h (profissional) ───────────────────────────────────────
export async function sendProfessionalReminder24hEmail(
  to: string, professionalName: string,
  clientName: string, service: string,
  date: string, time: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Lembrete: sessão com ${clientName} amanhã ⏰`,
    html: emailLayout(
      'Lembrete',
      'Você tem uma sessão amanhã. ⏰',
      `<p class="greet">Olá, ${professionalName}!</p>
      <p class="bt">Lembrete da sua sessão com <strong>${clientName}</strong> amanhã.</p>
      ${infoBox([
        { label: '👤 Cliente', value: clientName },
        { label: '🎯 Serviço', value: service },
        { label: '📅 Data', value: date },
        { label: '🕐 Horário', value: time },
      ])}
      ${cta(`${APP_URL}/profissional/agenda`, 'Ver minha agenda →')}
      ${signoff()}`
    ),
  })
}

// ─── 8. Cancelamento ──────────────────────────────────────────────────────
export async function sendBookingCancelledEmail(
  to: string, name: string,
  professionalName: string, date: string, time: string,
  cancelledBy: 'user' | 'professional',
) {
  return sendEmail({
    from: from(), to,
    subject: `Sessão cancelada com ${professionalName}`,
    html: emailLayout(
      'Cancelamento',
      'Sessão cancelada.',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">A sessão abaixo foi cancelada${cancelledBy === 'professional' ? ' pelo profissional' : ''}.</p>
      ${infoBox([
        { label: '👤 Profissional', value: professionalName },
        { label: '📅 Data', value: date },
        { label: '🕐 Horário', value: time },
      ])}
      ${cancelledBy === 'professional' ? '<div class="warn"><p>⚠️ O profissional cancelou esta sessão. Pedimos desculpas pelo inconveniente. Se houver cobrança, o reembolso será processado automaticamente.</p></div>' : ''}
      ${cta(`${APP_URL}/buscar`, 'Buscar outros profissionais →')}
      ${signoff()}`
    ),
  })
}

// ─── 9. Confirmação de pagamento ───────────────────────────────────────────
export async function sendPaymentConfirmationEmail(
  to: string, name: string,
  professionalName: string, service: string,
  amount: string, date: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Pagamento confirmado — ${amount} ✅`,
    html: emailLayout(
      'Pagamento',
      'Pagamento confirmado. ✅',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Recebemos seu pagamento com sucesso.</p>
      ${infoBox([
        { label: '🎯 Serviço', value: service },
        { label: '👤 Profissional', value: professionalName },
        { label: '💳 Valor', value: amount },
        { label: '📅 Data', value: date },
      ])}
      <div class="hbox"><p>Guarde este email como comprovante. O valor foi processado com segurança via Stripe.</p></div>
      ${cta(`${APP_URL}/agenda`, 'Ver meus agendamentos →')}
      ${signoff()}`
    ),
  })
}

// ─── 10. Falha no pagamento ────────────────────────────────────────────────
export async function sendPaymentFailedEmail(
  to: string, name: string, service: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Falha no pagamento — ação necessária ⚠️`,
    html: emailLayout(
      'Atenção',
      'Problema com seu pagamento. ⚠️',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Não conseguimos processar o pagamento para <strong>${service}</strong>.</p>
      <div class="danger"><p>⚠️ Seu agendamento pode ser cancelado se o pagamento não for concluído em 24h.</p></div>
      <p class="bt">Por favor, verifique se o cartão está válido e tente novamente.</p>
      ${cta(`${APP_URL}/agenda`, 'Atualizar pagamento →')}
      ${signoff()}`
    ),
  })
}

// ─── 11. Reembolso ────────────────────────────────────────────────────────
export async function sendRefundEmail(
  to: string, name: string,
  amount: string, service: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Reembolso processado — ${amount} 💰`,
    html: emailLayout(
      'Reembolso',
      'Reembolso a caminho. 💰',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Seu reembolso de <strong>${amount}</strong> referente a <strong>${service}</strong> foi processado com sucesso.</p>
      <div class="hbox"><p>O valor aparecerá na sua conta em até 5 dias úteis, dependendo do seu banco.</p></div>
      ${cta(`${APP_URL}/agenda`, 'Ver meu histórico →')}
      ${signoff()}`
    ),
  })
}

// ─── 16. Solicitar avaliação (24h após sessão) ────────────────────────────
export async function sendRequestReviewEmail(
  to: string, name: string,
  professionalName: string, service: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Como foi sua sessão com ${professionalName}? ⭐`,
    html: emailLayout(
      'Sua opinião importa',
      'Como foi a sessão? ⭐',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Sua sessão de <strong>${service}</strong> com <strong>${professionalName}</strong> foi concluída. O que você achou?</p>
      <p class="bt">Avaliações ajudam outros brasileiros no exterior a encontrar os melhores profissionais — e levam menos de 1 minuto.</p>
      <div class="hbox"><p>Sua avaliação é anônima para outros usuários e ajuda o profissional a melhorar.</p></div>
      ${cta(`${APP_URL}/agenda`, 'Avaliar sessão →', 'Leva menos de 1 minuto')}
      ${signoff()}`
    ),
  })
}

// ─── 17. Reagendamento ────────────────────────────────────────────────────
export async function sendRescheduledEmail(
  to: string, name: string,
  professionalName: string, service: string,
  oldDate: string, oldTime: string,
  newDate: string, newTime: string, timezone: string,
  rescheduledBy: 'user' | 'professional',
) {
  return sendEmail({
    from: from(), to,
    subject: `Sessão reagendada com ${professionalName} 📅`,
    html: emailLayout(
      'Reagendamento',
      'Sessão reagendada. 📅',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Sua sessão com <strong>${professionalName}</strong> foi reagendada${rescheduledBy === 'professional' ? ' pelo profissional' : ''}.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;">
          <p style="font-size:11px;font-weight:600;color:#9b9789;text-transform:uppercase;margin:0 0 8px;">Antes</p>
          <p style="font-size:14px;font-weight:600;color:#b91c1c;margin:0;">📅 ${oldDate}</p>
          <p style="font-size:14px;font-weight:600;color:#b91c1c;margin:4px 0 0;">🕐 ${oldTime}</p>
        </div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;">
          <p style="font-size:11px;font-weight:600;color:#9b9789;text-transform:uppercase;margin:0 0 8px;">Novo horário</p>
          <p style="font-size:14px;font-weight:600;color:#15803d;margin:0;">📅 ${newDate}</p>
          <p style="font-size:14px;font-weight:600;color:#15803d;margin:4px 0 0;">🕐 ${newTime} (${timezone})</p>
        </div>
      </div>
      ${cta(`${APP_URL}/agenda`, 'Ver meus agendamentos →')}
      ${signoff()}`
    ),
  })
}
