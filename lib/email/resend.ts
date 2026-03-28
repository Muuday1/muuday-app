import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://muuday.com'

// ─── Resend Topics (notification preferences) ─────────────────────────────
export const TOPICS = {
  agendamentos: '810ece2f-4e43-4214-ad94-2a2f628806ee',
  lembretes:    'ffdef00a-0e97-4ccf-80a9-695dbed7e11e',
  novidades:    '9882500d-3801-43b2-9ef4-98c1bdbede27',
}

// ─── Resend Segments ──────────────────────────────────────────────────────
export const SEGMENTS = {
  waitlist:    'e0503d46-8a25-4b74-8615-96d82e3b19e1',
  usuarios:    '64e6c00e-143f-4759-be90-d54c88a53d0e',
  general:     'f6979342-5de0-4383-b617-cf4f0a277ecc',
}

// ─── Add contact to Resend audience ──────────────────────────────────────
export async function addContactToResend(
  email: string,
  firstName: string,
  segmentId: string,
) {
  try {
    await resend.contacts.create({
      email,
      firstName,
      unsubscribed: false,
      audienceId: segmentId,
    })
  } catch {
    // Non-blocking — don't fail the main flow if this errors
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 EMAIL THEME — change everything here, all emails update automatically
// ─────────────────────────────────────────────────────────────────────────────
const THEME = {
  // Sender
  from:           'Muuday <noreply@muuday.com>',

  // Brand colors
  primary:        '#1a8a50',   // green — hero bg, CTA button, logo, links
  primaryLight:   '#e8f5ee',   // light green — highlight box bg, feature icons
  primaryDark:    '#0f5230',   // dark green — highlight box text
  primaryMid:     '#1a8a50',   // border accent on highlight box

  // Backgrounds
  pageBg:         '#f6f4ef',   // outer page background
  cardBg:         '#ffffff',   // email card background
  footerBg:       '#fafaf8',   // footer background

  // Text
  textDark:       '#1e1d18',   // headings, strong text
  textBody:       '#3d3c36',   // body text
  textMuted:      '#9b9789',   // footer, subtitles
  textSecondary:  '#5c5a52',   // feature descriptions, footer links

  // Status colors
  successBg:      '#f0fdf4',
  successBorder:  '#bbf7d0',
  successText:    '#15803d',
  warnBg:         '#fff7ed',
  warnBorder:     '#fed7aa',
  warnText:       '#c2410c',
  dangerBg:       '#fef2f2',
  dangerBorder:   '#fecaca',
  dangerText:     '#b91c1c',
  starsBg:        '#fefce8',
  starsBorder:    '#fef08a',
  starsText:      '#713f12',

  // Logo
  logoChar:       'm',         // character shown in the logo square
  logoName:       'muuday',    // brand name shown below logo
  logoRadius:     '14px',

  // Typography
  fontFamily:     "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontImport:     "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",

  // Social links in footer
  instagram:      'https://instagram.com/usemuuday',
  contact:        'hello@muuday.com',

  // Signoff
  signoffText:    'Qualquer dúvida, responde este email. A gente lê tudo.',
  signoffName:    'Equipe Muuday',
  signoffRole:    'muuday.com',

  // Footer tagline
  tagline:        'Especialistas brasileiros, onde você estiver.',
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared layout ────────────────────────────────────────────────────────
function emailLayout(heroBadge: string, heroTitle: string, body: string) {
  const T = THEME
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<style>
  @import url('${T.fontImport}');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background-color:${T.pageBg};font-family:${T.fontFamily};-webkit-font-smoothing:antialiased;color:${T.textDark};}
  .ew{background-color:${T.pageBg};padding:40px 16px;}
  .ec{max-width:600px;margin:0 auto;}
  .eh{text-align:center;padding:0 0 32px;}
  .lm{display:inline-block;background-color:${T.primary};border-radius:${T.logoRadius};width:48px;height:48px;line-height:48px;text-align:center;font-size:22px;font-weight:800;color:#fff;font-family:${T.fontFamily};letter-spacing:-0.03em;}
  .lt{display:block;font-size:20px;font-weight:700;color:${T.primary};letter-spacing:-0.02em;margin-top:10px;}
  .card{background-color:${T.cardBg};border-radius:24px;overflow:hidden;border:1px solid rgba(30,29,24,0.08);}
  .hero{background-color:${T.primary};padding:40px 48px 36px;position:relative;overflow:hidden;}
  .badge{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:999px;padding:4px 14px;font-size:12px;font-weight:600;color:#fff;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:16px;}
  .htitle{font-size:28px;font-weight:700;color:#fff;line-height:1.25;letter-spacing:-0.02em;margin:0;position:relative;z-index:1;}
  .bd{padding:40px 48px;}
  .greet{font-size:16px;font-weight:600;color:${T.textDark};margin-bottom:20px;}
  .bt{font-size:15px;color:${T.textBody};line-height:1.7;margin-bottom:18px;}
  .bt strong{font-weight:600;color:${T.textDark};}
  .hbox{background-color:${T.primaryLight};border-left:3px solid ${T.primaryMid};border-radius:0 12px 12px 0;padding:16px 20px;margin:24px 0;}
  .hbox p{font-size:15px;font-weight:500;color:${T.primaryDark};line-height:1.6;margin:0;}
  .ibox{background:#f9f9f7;border:1px solid rgba(30,29,24,0.08);border-radius:16px;padding:20px 24px;margin:20px 0;}
  .ibox table{width:100%;border-collapse:collapse;}
  .ibox td{padding:8px 0;font-size:14px;border-bottom:1px solid #f0ede6;}
  .ibox tr:last-child td{border-bottom:none;}
  .ibox .ilabel{color:${T.textMuted};}
  .ibox .ival{color:${T.textDark};font-weight:600;text-align:right;}
  .flist{list-style:none;margin:24px 0;padding:0;}
  .fi{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #f0ede6;}
  .fi:last-child{border-bottom:none;}
  .ficon{width:32px;height:32px;min-width:32px;background-color:${T.primaryLight};border-radius:8px;text-align:center;line-height:32px;font-size:15px;}
  .ftitle{font-size:14px;font-weight:600;color:${T.textDark};margin-bottom:2px;}
  .fdesc{font-size:13px;color:${T.textSecondary};line-height:1.5;margin:0;}
  .ctaw{text-align:center;margin:32px 0 8px;}
  .cta{display:inline-block;background-color:${T.primary};color:#fff !important;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:999px;letter-spacing:-0.01em;}
  .ctasub{display:block;text-align:center;font-size:13px;color:${T.textMuted};margin-top:12px;}
  .div{height:1px;background-color:#f0ede6;margin:32px 0;}
  .so{margin-top:32px;}
  .sotext{font-size:15px;color:${T.textBody};line-height:1.7;margin-bottom:16px;}
  .soname{font-size:15px;font-weight:600;color:${T.textDark};margin-bottom:2px;}
  .sorole{font-size:13px;color:${T.textMuted};}
  .foot{padding:28px 48px;background-color:${T.footerBg};border-top:1px solid rgba(30,29,24,0.06);}
  .flogo{font-size:16px;font-weight:700;color:${T.primary};letter-spacing:-0.02em;margin-bottom:8px;}
  .ftag{font-size:13px;color:${T.textMuted};margin-bottom:20px;line-height:1.5;}
  .flinks{margin-bottom:16px;}
  .flinks a{font-size:13px;color:${T.textSecondary};text-decoration:none;margin-right:16px;}
  .unsub{font-size:12px;color:${T.textMuted};margin-top:8px;}
  .unsub a{color:${T.textMuted};text-decoration:underline;}
  .warn{background:${T.warnBg};border:1px solid ${T.warnBorder};border-radius:12px;padding:16px 20px;margin:16px 0;}
  .warn p{font-size:14px;font-weight:600;color:${T.warnText};margin:0;}
  .danger{background:${T.dangerBg};border:1px solid ${T.dangerBorder};border-radius:12px;padding:16px 20px;margin:16px 0;}
  .danger p{font-size:14px;color:${T.dangerText};margin:0;}
  .success{background:${T.successBg};border:1px solid ${T.successBorder};border-radius:12px;padding:16px 20px;margin:16px 0;}
  .success p{font-size:14px;font-weight:600;color:${T.successText};margin:0;}
  .stars{background:${T.starsBg};border:1px solid ${T.starsBorder};border-radius:12px;padding:20px 24px;margin:16px 0;}
  @media(max-width:600px){.ew{padding:24px 12px;}.hero{padding:28px 24px;}.bd{padding:28px 24px;}.foot{padding:24px;}.htitle{font-size:22px;}.cta{padding:14px 32px;font-size:14px;}}
</style>
</head>
<body>
<div class="ew">
  <div class="ec">
    <div class="eh">
      <span class="lm">${T.logoChar}</span>
      <span class="lt">${T.logoName}</span>
    </div>
    <div class="card">
      <div class="hero">
        <div class="badge">${heroBadge}</div>
        <h1 class="htitle">${heroTitle}</h1>
      </div>
      <div class="bd">
        ${body}
      </div>
      <div class="foot">
        <div class="flogo">${T.logoName}</div>
        <div class="ftag">${T.tagline}</div>
        <div class="flinks">
          <a href="${APP_URL}">Website</a>
          <a href="${T.instagram}">Instagram</a>
          <a href="mailto:${T.contact}">Contato</a>
        </div>
        <div class="unsub">Não quer mais receber estes emails? <a href="${APP_URL}/configuracoes">Cancelar subscrição</a></div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}

function cta(href: string, label: string, sub?: string) {
  return `<div class="ctaw">
    <a href="${href}" class="cta">${label}</a>
    ${sub ? `<span class="ctasub">${sub}</span>` : ''}
  </div>`
}

function infoBox(rows: { label: string; value: string }[]) {
  return `<div class="ibox"><table>${rows.map(r =>
    `<tr><td class="ilabel">${r.label}</td><td class="ival">${r.value}</td></tr>`
  ).join('')}</table></div>`
}

function signoff() {
  return `<div class="div"></div>
  <div class="so">
    <p class="sotext">${THEME.signoffText}</p>
    <p class="soname">${THEME.signoffName}</p>
    <p class="sorole">${THEME.signoffRole}</p>
  </div>`
}

function from() { return THEME.from }

// ─── 1. Boas-vindas ────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: from(), to,
    subject: 'Bem-vindo à Muuday! 🎉',
    html: emailLayout(
      'Bem-vindo',
      'Você está dentro. 🎉',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Seja bem-vindo à Muuday! Agora você tem acesso a profissionais brasileiros qualificados em qualquer lugar do mundo.</p>
      <ul class="flist">
        <li class="fi"><div class="ficon">🔍</div><div><div class="ftitle">Buscar profissionais</div><p class="fdesc">Encontre especialistas por área, idioma e disponibilidade</p></div></li>
        <li class="fi"><div class="ficon">📅</div><div><div class="ftitle">Agendar sessões</div><p class="fdesc">Reserve horários diretamente na agenda — no seu fuso</p></div></li>
        <li class="fi"><div class="ficon">💳</div><div><div class="ftitle">Pagar em libra, euro ou dólar</div><p class="fdesc">Sem complicação, sem conversão manual</p></div></li>
      </ul>
      ${cta(`${APP_URL}/explorar`, 'Explorar profissionais →')}
      ${signoff()}`
    ),
  })
}

// ─── 2. Completar conta (social login) ────────────────────────────────────
export async function sendCompleteAccountEmail(to: string, name: string) {
  return resend.emails.send({
    from: from(), to,
    subject: 'Complete seu perfil na Muuday ✨',
    html: emailLayout(
      'Quase lá',
      'Falta só um passo. ✨',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Você criou sua conta mas ainda não preencheu algumas informações importantes — fuso horário e moeda. Leva menos de 1 minuto.</p>
      <div class="hbox"><p>Sem essas informações, os horários podem aparecer incorretos e os preços não serão exibidos na sua moeda.</p></div>
      ${cta(`${APP_URL}/completar-conta`, 'Completar meu perfil →')}
      ${signoff()}`
    ),
  })
}

// ─── 3. Confirmação de agendamento (usuário) ──────────────────────────────
export async function sendBookingConfirmationEmail(
  to: string, name: string,
  professionalName: string, service: string,
  date: string, time: string, timezone: string,
) {
  return resend.emails.send({
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
      ${cta(`${APP_URL}/dashboard`, 'Ver meus agendamentos →')}
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
  return resend.emails.send({
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
  return resend.emails.send({
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
      ${cta(`${APP_URL}/dashboard`, 'Ver detalhes →')}
      ${signoff()}`
    ),
  })
}

// ─── 6. Lembrete 1h antes (usuário) ───────────────────────────────────────
export async function sendSessionReminder1hEmail(
  to: string, name: string,
  professionalName: string, time: string, timezone: string,
) {
  return resend.emails.send({
    from: from(), to,
    subject: `Sua sessão começa em 1 hora! 🚀`,
    html: emailLayout(
      'Agora',
      'Começa em 1 hora. 🚀',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Sua sessão com <strong>${professionalName}</strong> começa às <strong>${time} (${timezone})</strong>.</p>
      <div class="success"><p>✅ Certifique-se de estar em um local tranquilo e com boa conexão à internet.</p></div>
      ${cta(`${APP_URL}/dashboard`, 'Acessar sessão →')}
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
  return resend.emails.send({
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
  return resend.emails.send({
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
      ${cta(`${APP_URL}/explorar`, 'Buscar outros profissionais →')}
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
  return resend.emails.send({
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
      ${cta(`${APP_URL}/dashboard`, 'Ver meus agendamentos →')}
      ${signoff()}`
    ),
  })
}

// ─── 10. Falha no pagamento ────────────────────────────────────────────────
export async function sendPaymentFailedEmail(
  to: string, name: string, service: string,
) {
  return resend.emails.send({
    from: from(), to,
    subject: `Falha no pagamento — ação necessária ⚠️`,
    html: emailLayout(
      'Atenção',
      'Problema com seu pagamento. ⚠️',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Não conseguimos processar o pagamento para <strong>${service}</strong>.</p>
      <div class="danger"><p>⚠️ Seu agendamento pode ser cancelado se o pagamento não for concluído em 24h.</p></div>
      <p class="bt">Por favor, verifique se o cartão está válido e tente novamente.</p>
      ${cta(`${APP_URL}/dashboard`, 'Atualizar pagamento →')}
      ${signoff()}`
    ),
  })
}

// ─── 11. Reembolso ────────────────────────────────────────────────────────
export async function sendRefundEmail(
  to: string, name: string,
  amount: string, service: string,
) {
  return resend.emails.send({
    from: from(), to,
    subject: `Reembolso processado — ${amount} 💰`,
    html: emailLayout(
      'Reembolso',
      'Reembolso a caminho. 💰',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Seu reembolso de <strong>${amount}</strong> referente a <strong>${service}</strong> foi processado com sucesso.</p>
      <div class="hbox"><p>O valor aparecerá na sua conta em até 5 dias úteis, dependendo do seu banco.</p></div>
      ${cta(`${APP_URL}/dashboard`, 'Ver meu histórico →')}
      ${signoff()}`
    ),
  })
}

// ─── 12. Nova avaliação (profissional) ────────────────────────────────────
export async function sendNewReviewEmail(
  to: string, professionalName: string,
  clientName: string, rating: number, comment: string,
) {
  const stars = '⭐'.repeat(rating)
  return resend.emails.send({
    from: from(), to,
    subject: `${clientName} deixou uma avaliação — ${stars}`,
    html: emailLayout(
      'Nova avaliação',
      `Você recebeu ${stars}`,
      `<p class="greet">Olá, ${professionalName}!</p>
      <p class="bt"><strong>${clientName}</strong> avaliou sua sessão.</p>
      <div class="stars">
        <p style="color:#854d0e;font-size:13px;font-weight:600;margin:0 0 8px;">${stars} ${rating}/5</p>
        <p style="color:#713f12;font-size:15px;font-style:italic;margin:0;">"${comment}"</p>
      </div>
      <p class="bt" style="font-size:13px;">Avaliações positivas aumentam sua visibilidade na plataforma.</p>
      ${cta(`${APP_URL}/profissional/perfil`, 'Ver meu perfil →')}
      ${signoff()}`
    ),
  })
}

// ─── 13. Perfil aprovado (profissional) ───────────────────────────────────
export async function sendProfileApprovedEmail(to: string, professionalName: string) {
  return resend.emails.send({
    from: from(), to,
    subject: `Seu perfil foi aprovado na Muuday! 🎉`,
    html: emailLayout(
      'Aprovado',
      'Você está no ar! 🎉',
      `<p class="greet">Parabéns, ${professionalName}!</p>
      <p class="bt">Seu perfil foi revisado e aprovado. Agora você está visível para clientes em todo o mundo.</p>
      <div class="success"><p>✅ Seu perfil está ativo. Configure sua disponibilidade para começar a receber agendamentos.</p></div>
      <ul class="flist">
        <li class="fi"><div class="ficon">📅</div><div><div class="ftitle">Configure sua agenda</div><p class="fdesc">Defina seus horários disponíveis</p></div></li>
        <li class="fi"><div class="ficon">💰</div><div><div class="ftitle">Defina seus preços</div><p class="fdesc">Configure valores por serviço</p></div></li>
        <li class="fi"><div class="ficon">🌍</div><div><div class="ftitle">Aguarde os primeiros clientes</div><p class="fdesc">Seu perfil já aparece nas buscas</p></div></li>
      </ul>
      ${cta(`${APP_URL}/profissional/agenda`, 'Configurar disponibilidade →')}
      ${signoff()}`
    ),
  })
}

// ─── 14. Perfil rejeitado (profissional) ──────────────────────────────────
export async function sendProfileRejectedEmail(
  to: string, professionalName: string, reason: string,
) {
  return resend.emails.send({
    from: from(), to,
    subject: `Atualização sobre seu perfil na Muuday`,
    html: emailLayout(
      'Revisão necessária',
      'Seu perfil precisa de ajustes.',
      `<p class="greet">Olá, ${professionalName}!</p>
      <p class="bt">Analisamos seu perfil e ele precisa de alguns ajustes antes de ser publicado.</p>
      <div class="danger">
        <p style="font-weight:600;margin-bottom:6px;">Motivo:</p>
        <p>${reason}</p>
      </div>
      <p class="bt">Após atualizar, seu perfil será revisado novamente.</p>
      ${cta(`${APP_URL}/profissional/perfil/editar`, 'Atualizar meu perfil →')}
      ${signoff()}`
    ),
  })
}

// ─── 15. Newsletter / Novidades e promoções ───────────────────────────────
export async function sendNewsletterEmail(
  to: string, name: string,
  subject: string, badge: string, headline: string, body: string,
  ctaLabel: string, ctaUrl: string, ctaSub?: string,
) {
  return resend.emails.send({
    from: from(), to, subject,
    html: emailLayout(
      badge,
      headline,
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">${body}</p>
      ${cta(ctaUrl, ctaLabel, ctaSub)}
      ${signoff()}`
    ),
  })
}

// ─── 16. Solicitar avaliação (24h após sessão) ────────────────────────────
export async function sendRequestReviewEmail(
  to: string, name: string,
  professionalName: string, service: string,
) {
  return resend.emails.send({
    from: from(), to,
    subject: `Como foi sua sessão com ${professionalName}? ⭐`,
    html: emailLayout(
      'Sua opinião importa',
      'Como foi a sessão? ⭐',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Sua sessão de <strong>${service}</strong> com <strong>${professionalName}</strong> foi concluída. O que você achou?</p>
      <p class="bt">Avaliações ajudam outros brasileiros no exterior a encontrar os melhores profissionais — e levam menos de 1 minuto.</p>
      <div class="hbox"><p>Sua avaliação é anônima para outros usuários e ajuda o profissional a melhorar.</p></div>
      ${cta(`${APP_URL}/dashboard`, 'Avaliar sessão →', 'Leva menos de 1 minuto')}
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
  return resend.emails.send({
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
      ${cta(`${APP_URL}/dashboard`, 'Ver meus agendamentos →')}
      ${signoff()}`
    ),
  })
}

// ─── 18. Lembrete perfil incompleto (profissional) ────────────────────────
export async function sendIncompleteProfileReminderEmail(
  to: string, professionalName: string, missingItems: string[],
) {
  const items = missingItems.map(i =>
    `<li class="fi"><div class="ficon">⚠️</div><div><div class="ftitle">${i}</div></div></li>`
  ).join('')
  return resend.emails.send({
    from: from(), to,
    subject: `Seu perfil está incompleto — complete para aparecer nas buscas`,
    html: emailLayout(
      'Ação necessária',
      'Complete seu perfil para ser encontrado.',
      `<p class="greet">Olá, ${professionalName}!</p>
      <p class="bt">Seu perfil ainda está incompleto. Perfis completos aparecem nas buscas e convertem muito mais clientes.</p>
      <p class="bt" style="font-weight:600;color:#1e1d18;">O que ainda falta:</p>
      <ul class="flist">${items}</ul>
      ${cta(`${APP_URL}/profissional/perfil/editar`, 'Completar meu perfil →', 'Leva menos de 5 minutos')}
      ${signoff()}`
    ),
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKETING & LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

// ─── 19. Confirmação lista de espera (landing page) ───────────────────────
export async function sendWaitlistConfirmationEmail(to: string, name: string) {
  return resend.emails.send({
    from: from(), to,
    subject: `Você está na lista! 🎉`,
    html: emailLayout(
      'Lista de espera',
      'Recebemos seu cadastro. 🎉',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Você entrou na lista de espera da Muuday. Assim que abrirmos, você será um dos primeiros a saber.</p>
      <div class="hbox"><p>Seu lugar está guardado — você tem <strong>acesso prioritário</strong> e vai entrar antes de qualquer pessoa que se cadastrar depois de hoje.</p></div>
      <p class="bt">A Muuday conecta brasileiros no exterior a profissionais qualificados — psicólogos, contadores, advogados, nutricionistas e mais — no seu idioma e no seu fuso.</p>
      ${cta(`${APP_URL}`, 'Conhecer a Muuday →')}
      ${signoff()}`
    ),
  })
}

// ─── 20. Série boas-vindas #1 — Dia 0 (o que estamos construindo) ─────────
export async function sendWelcomeSeries1Email(to: string, name: string) {
  return resend.emails.send({
    from: from(), to,
    subject: `O que estamos construindo para você`,
    html: emailLayout(
      'O que vem por aí',
      'O que estamos construindo para você.',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Já faz uma semana que você está na lista. Queremos te contar o que estamos construindo.</p>
      <p class="bt"><strong>O que a Muuday vai ter quando abrir:</strong></p>
      <ul class="flist">
        <li class="fi"><div class="ficon">🧠</div><div><div class="ftitle">Perfis verificados</div><p class="fdesc">Psicólogos, contadores, advogados, nutricionistas, professores, coaches e mais. Cada um com especialidade, avaliações reais e disponibilidade visível.</p></div></li>
        <li class="fi"><div class="ficon">🕐</div><div><div class="ftitle">Agendamento com fuso automático</div><p class="fdesc">Você vê o horário do profissional no seu fuso. Ele vê no fuso dele. Sem confusão, sem marcar errado.</p></div></li>
        <li class="fi"><div class="ficon">💳</div><div><div class="ftitle">Pagamento em libra, euro ou dólar</div><p class="fdesc">Sem Pix, sem transferência internacional. Você paga como qualquer serviço online no seu país.</p></div></li>
        <li class="fi"><div class="ficon">🔄</div><div><div class="ftitle">Recorrência que funciona</div><p class="fdesc">Para sessões regulares, a Muuday gerencia o calendário e o pagamento automaticamente.</p></div></li>
      </ul>
      <div class="hbox"><p>Ainda estamos em construção. Mas você já está dentro — e vai saber antes de todo mundo.</p></div>
      ${cta(`${APP_URL}`, 'Conhece alguém que precisaria disso?', 'Compartilha o link — cada indicação ajuda a construir a comunidade')}
      ${signoff()}`
    ),
  })
}

// ─── 21. Série boas-vindas #2 — Dia 3 (quem são os profissionais) ─────────
export async function sendWelcomeSeries2Email(to: string, name: string) {
  return resend.emails.send({
    from: from(), to,
    subject: `Quem são os profissionais da Muuday?`,
    html: emailLayout(
      'Os profissionais',
      'Brasileiros qualificados, onde você está.',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Quando pensamos na Muuday, pensamos em você — brasileiro morando fora, que às vezes precisa de um psicólogo que entenda sua cultura, um contador que saiba do seu CPF no Brasil, ou um advogado que fale a sua língua.</p>
      <p class="bt"><strong>Os profissionais que estamos trazendo para a plataforma:</strong></p>
      <ul class="flist">
        <li class="fi"><div class="ficon">🧠</div><div><div class="ftitle">Psicólogos</div><p class="fdesc">Terapia em português, no seu fuso. Sem barreira de idioma ou de cultura.</p></div></li>
        <li class="fi"><div class="ficon">📊</div><div><div class="ftitle">Contadores</div><p class="fdesc">CPF, IR, conta no Brasil — tudo resolvido remotamente.</p></div></li>
        <li class="fi"><div class="ficon">⚖️</div><div><div class="ftitle">Advogados</div><p class="fdesc">Questões jurídicas brasileiras e de expatriados.</p></div></li>
        <li class="fi"><div class="ficon">🥗</div><div><div class="ftitle">Nutricionistas</div><p class="fdesc">Alimentação saudável adaptada à realidade de quem mora fora.</p></div></li>
        <li class="fi"><div class="ficon">🎯</div><div><div class="ftitle">Coaches e mentores</div><p class="fdesc">Carreira, transição de vida, adaptação ao novo país.</p></div></li>
      </ul>
      <p class="bt">Todos são verificados pela nossa equipe antes de aparecerem na plataforma.</p>
      ${cta(`${APP_URL}`, 'Ver como vai funcionar →')}
      ${signoff()}`
    ),
  })
}

// ─── 22. Série boas-vindas #3 — Dia 7 (acesso antecipado) ────────────────
export async function sendWelcomeSeries3Email(to: string, name: string) {
  return resend.emails.send({
    from: from(), to,
    subject: `Você tem acesso antecipado — o que isso significa`,
    html: emailLayout(
      'Acesso antecipado',
      'O que significa estar na lista.',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Você se cadastrou há uma semana. Isso significa que quando a Muuday abrir, você vai:</p>
      <ul class="flist">
        <li class="fi"><div class="ficon">🚀</div><div><div class="ftitle">Entrar antes de todo mundo</div><p class="fdesc">Acesso antes de qualquer pessoa que se cadastrar depois de você.</p></div></li>
        <li class="fi"><div class="ficon">💰</div><div><div class="ftitle">Preços de lançamento</div><p class="fdesc">Condições especiais para os primeiros usuários.</p></div></li>
        <li class="fi"><div class="ficon">🎙️</div><div><div class="ftitle">Voz na plataforma</div><p class="fdesc">Seu feedback vai moldar o que construímos a seguir.</p></div></li>
      </ul>
      <div class="hbox"><p>Ainda não temos data de abertura confirmada. Mas você será o primeiro a saber — por email, antes de qualquer anúncio público.</p></div>
      <p class="bt">Uma coisa que você pode fazer agora: indicar a Muuday para amigos que moram fora do Brasil. Cada pessoa que se cadastrar pela sua indicação sobe na fila junto com você.</p>
      ${cta(`${APP_URL}`, 'Indicar um amigo →', 'Compartilha o link da lista de espera')}
      ${signoff()}`
    ),
  })
}

// ─── 23. Convite de amigos (referral) ─────────────────────────────────────
export async function sendReferralInviteEmail(
  to: string, inviterName: string, referralLink: string,
) {
  return resend.emails.send({
    from: from(), to,
    subject: `${inviterName} te convidou para a Muuday 👋`,
    html: emailLayout(
      'Convite',
      `${inviterName} quer que você conheça a Muuday.`,
      `<p class="bt"><strong>${inviterName}</strong> te convidou para a Muuday — a plataforma que conecta brasileiros no exterior a profissionais qualificados.</p>
      <ul class="flist">
        <li class="fi"><div class="ficon">🧠</div><div><div class="ftitle">Psicólogos, contadores, advogados e mais</div><p class="fdesc">Profissionais brasileiros verificados, atendendo no exterior</p></div></li>
        <li class="fi"><div class="ficon">🕐</div><div><div class="ftitle">Agenda no seu fuso</div><p class="fdesc">Sem confusão de horário — você vê tudo no seu fuso automaticamente</p></div></li>
        <li class="fi"><div class="ficon">💳</div><div><div class="ftitle">Pague em libra, euro ou dólar</div><p class="fdesc">Sem complicação, sem conversão manual</p></div></li>
      </ul>
      ${cta(referralLink, 'Entrar na Muuday →', 'Acesso gratuito · Sem cartão necessário')}`
    ),
  })
}

// ─── 24. Nudge primeiro agendamento (3 dias sem agendar) ──────────────────
export async function sendFirstBookingNudgeEmail(to: string, name: string) {
  return resend.emails.send({
    from: from(), to,
    subject: `${name}, já encontrou seu profissional? 🔍`,
    html: emailLayout(
      'Próximo passo',
      'Está tudo pronto para sua primeira sessão.',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Você criou sua conta há alguns dias mas ainda não agendou sua primeira sessão. Está tudo pronto — leva menos de 2 minutos para encontrar e reservar com um profissional.</p>
      <div class="hbox"><p>Mais de X profissionais brasileiros estão disponíveis agora. Você pode filtrar por especialidade, idioma e horário.</p></div>
      ${cta(`${APP_URL}/explorar`, 'Ver profissionais disponíveis →')}
      ${signoff()}`
    ),
  })
}

// ─── 25. Re-engajamento (30 dias sem login) ───────────────────────────────
export async function sendReengagementEmail(to: string, name: string) {
  return resend.emails.send({
    from: from(), to,
    subject: `Sentimos sua falta, ${name} 👋`,
    html: emailLayout(
      'Novidades',
      'Muita coisa nova desde sua última visita.',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Faz um tempo que você não visita a Muuday. Enquanto isso, adicionamos novos profissionais e melhoramos bastante a plataforma.</p>
      <ul class="flist">
        <li class="fi"><div class="ficon">✨</div><div><div class="ftitle">Novos profissionais</div><p class="fdesc">Mais especialidades disponíveis na plataforma</p></div></li>
        <li class="fi"><div class="ficon">📅</div><div><div class="ftitle">Agenda melhorada</div><p class="fdesc">Mais fácil de encontrar horários disponíveis</p></div></li>
        <li class="fi"><div class="ficon">💬</div><div><div class="ftitle">Avaliações reais</div><p class="fdesc">Mais avaliações de clientes para ajudar na sua escolha</p></div></li>
      </ul>
      ${cta(`${APP_URL}/explorar`, 'Voltar para a Muuday →')}
      ${signoff()}`
    ),
  })
}

// ─── 26. Email de lançamento (para lista de espera) ───────────────────────
export async function sendLaunchEmail(to: string, name: string) {
  return resend.emails.send({
    from: from(), to,
    subject: `A Muuday está aberta. Você é um dos primeiros. 🚀`,
    html: emailLayout(
      'Lançamento',
      'A Muuday está no ar. 🚀',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Você se cadastrou na lista de espera — e prometemos que você seria o primeiro a saber. Aqui está.</p>
      <p class="bt"><strong>A Muuday está oficialmente aberta.</strong> Você tem acesso antes de qualquer outra pessoa.</p>
      <div class="hbox"><p>Use seu email de cadastro para criar sua conta. Você tem prioridade total — sem fila de espera.</p></div>
      <ul class="flist">
        <li class="fi"><div class="ficon">🧠</div><div><div class="ftitle">Profissionais verificados</div><p class="fdesc">Prontos para atender agora</p></div></li>
        <li class="fi"><div class="ficon">📅</div><div><div class="ftitle">Agende hoje</div><p class="fdesc">Primeiros slots disponíveis — reserve antes que encham</p></div></li>
        <li class="fi"><div class="ficon">💰</div><div><div class="ftitle">Preço de lançamento</div><p class="fdesc">Condições especiais para os primeiros usuários</p></div></li>
      </ul>
      ${cta(`${APP_URL}/cadastro`, 'Criar minha conta agora →', 'Acesso prioritário · Grátis para começar')}
      ${signoff()}`
    ),
  })
}
