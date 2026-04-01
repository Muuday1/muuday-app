/**
 * Updates ALL Supabase auth email templates to match the Muuday branded design.
 * Run: npx tsx scripts/ops/update-supabase-templates.ts YOUR_SUPABASE_MGMT_TOKEN
 *
 * Get token at: https://supabase.com/dashboard/account/tokens
 */

const PROJECT_REF = 'jbbnbbrroifghrshplsq'
const MANAGEMENT_TOKEN = process.argv[2]

if (!MANAGEMENT_TOKEN) {
  console.error('\n❌ Usage: npx tsx scripts/update-supabase-templates.ts YOUR_TOKEN\n')
  console.error('Get your token at: https://supabase.com/dashboard/account/tokens\n')
  process.exit(1)
}

// ─── Design tokens (must match lib/email/resend.ts THEME) ──────────────────
const T = {
  primary:       '#1a8a50',
  primaryLight:  '#e8f5ee',
  primaryDark:   '#0f5230',
  primaryMid:    '#1a8a50',
  pageBg:        '#f6f4ef',
  cardBg:        '#ffffff',
  footerBg:      '#fafaf8',
  textDark:      '#1e1d18',
  textBody:      '#3d3c36',
  textMuted:     '#9b9789',
  textSecondary: '#5c5a52',
  warnBg:        '#fff7ed',
  warnBorder:    '#fed7aa',
  warnText:      '#c2410c',
  dangerBg:      '#fef2f2',
  dangerBorder:  '#fecaca',
  dangerText:    '#b91c1c',
  fontFamily:    "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontImport:    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  logoChar:      'm',
  logoName:      'muuday',
  logoRadius:    '14px',
  instagram:     'https://instagram.com/usemuuday',
  contact:       'hello@muuday.com',
  signoffText:   'Qualquer dúvida, responde este email. A gente lê tudo.',
  signoffName:   'Equipe Muuday',
  signoffRole:   'muuday.com',
  tagline:       'Especialistas brasileiros, onde você estiver.',
  siteUrl:       'https://muuday.com',
}

const EMAIL_CSS = `
  @import url('${T.fontImport}');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background-color:${T.pageBg};font-family:${T.fontFamily};-webkit-font-smoothing:antialiased;color:${T.textDark};}
  .ew{background-color:${T.pageBg};padding:40px 16px;}
  .ec{max-width:600px;margin:0 auto;}
  .eh{text-align:center;padding:0 0 32px;}
  .lm{display:inline-block;background-color:${T.primary};border-radius:${T.logoRadius};width:48px;height:48px;line-height:48px;text-align:center;font-size:22px;font-weight:800;color:#fff;font-family:${T.fontFamily};letter-spacing:-0.03em;}
  .lt{display:block;font-size:20px;font-weight:700;color:${T.primary};letter-spacing:-0.02em;margin-top:10px;}
  .card{background-color:${T.cardBg};border-radius:24px;overflow:hidden;border:1px solid rgba(30,29,24,0.08);}
  .hero{background-color:${T.primary};padding:40px 48px 36px;}
  .badge{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:999px;padding:4px 14px;font-size:12px;font-weight:600;color:#fff;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:16px;}
  .htitle{font-size:28px;font-weight:700;color:#fff;line-height:1.25;letter-spacing:-0.02em;margin:0;}
  .bd{padding:40px 48px;}
  .greet{font-size:16px;font-weight:600;color:${T.textDark};margin-bottom:20px;}
  .bt{font-size:15px;color:${T.textBody};line-height:1.7;margin-bottom:18px;}
  .bt strong{font-weight:600;color:${T.textDark};}
  .hbox{background-color:${T.primaryLight};border-left:3px solid ${T.primaryMid};border-radius:0 12px 12px 0;padding:16px 20px;margin:24px 0;}
  .hbox p{font-size:15px;font-weight:500;color:${T.primaryDark};line-height:1.6;margin:0;}
  .otp{text-align:center;margin:28px 0;}
  .otpcode{display:inline-block;background:${T.primaryLight};border:2px solid ${T.primary};border-radius:16px;padding:18px 40px;font-size:36px;font-weight:800;color:${T.primary};letter-spacing:0.15em;font-family:monospace;}
  .ctaw{text-align:center;margin:32px 0 8px;}
  .cta{display:inline-block;background-color:${T.primary};color:#fff !important;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:999px;letter-spacing:-0.01em;}
  .ctasub{display:block;text-align:center;font-size:13px;color:${T.textMuted};margin-top:12px;}
  .urlbox{background:#f9f9f7;border:1px solid rgba(30,29,24,0.08);border-radius:12px;padding:14px 18px;margin:16px 0;word-break:break-all;}
  .urlbox a{font-size:12px;color:${T.primary};text-decoration:none;}
  .warn{background:${T.warnBg};border:1px solid ${T.warnBorder};border-radius:12px;padding:16px 20px;margin:16px 0;}
  .warn p{font-size:14px;font-weight:600;color:${T.warnText};margin:0;}
  .danger{background:${T.dangerBg};border:1px solid ${T.dangerBorder};border-radius:12px;padding:16px 20px;margin:16px 0;}
  .danger p{font-size:14px;color:${T.dangerText};margin:0;}
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
  @media(max-width:600px){.ew{padding:24px 12px;}.hero{padding:28px 24px;}.bd{padding:28px 24px;}.foot{padding:24px;}.htitle{font-size:22px;}.cta{padding:14px 32px;font-size:14px;}}
`

function layout(badge: string, title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<style>${EMAIL_CSS}</style>
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
        <div class="badge">${badge}</div>
        <h1 class="htitle">${title}</h1>
      </div>
      <div class="bd">
        ${body}
      </div>
      <div class="foot">
        <div class="flogo">${T.logoName}</div>
        <div class="ftag">${T.tagline}</div>
        <div class="flinks">
          <a href="${T.siteUrl}">Website</a>
          <a href="${T.instagram}">Instagram</a>
          <a href="mailto:${T.contact}">Contato</a>
        </div>
        <div class="unsub">Recebeu este email pois está cadastrado na Muuday.</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}

function signoff(): string {
  return `<div class="div"></div>
  <div class="so">
    <p class="sotext">${T.signoffText}</p>
    <p class="soname">${T.signoffName}</p>
    <p class="sorole">${T.signoffRole}</p>
  </div>`
}

// ─── Template HTML ─────────────────────────────────────────────────────────

// 1. Confirm sign up
const confirmSignup = layout(
  'Cadastro',
  'Falta só confirmar seu e-mail.',
  `<p class="greet">Olá!</p>
  <p class="bt">Seu cadastro na Muuday foi criado com sucesso. Agora, confirme seu e-mail para ativar a conta e proteger seu acesso.</p>
  <div class="hbox"><p>Depois da confirmação, você já pode entrar, salvar profissionais e agendar sua primeira sessão.</p></div>
  <div class="ctaw">
    <a href="{{ .ConfirmationURL }}" class="cta">Confirmar e-mail →</a>
    <span class="ctasub">Este link expira em 24 horas</span>
  </div>
  <div class="warn"><p>⚠️ Se você não criou esta conta, ignore este e-mail com segurança.</p></div>
  <p class="bt" style="font-size:13px;">Se o botão não funcionar, copie e cole este link no navegador:</p>
  <div class="urlbox"><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></div>
  ${signoff()}`
)

// 2. Invite user
const inviteUser = layout(
  'Convite',
  'Você foi convidado. 🎉',
  `<p class="greet">Olá!</p>
  <p class="bt">Você recebeu um convite para a <strong>Muuday</strong> — a plataforma de especialistas brasileiros para a diáspora.</p>
  <p class="bt">Clique abaixo para aceitar o convite e criar sua conta.</p>
  <div class="ctaw">
    <a href="{{ .ConfirmationURL }}" class="cta">Aceitar convite →</a>
    <span class="ctasub">O link expira em 24 horas</span>
  </div>
  <div class="warn"><p>⚠️ Se não esperava este convite, ignore este email com segurança.</p></div>
  <div class="urlbox"><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></div>
  ${signoff()}`
)

// 3. Magic link
const magicLink = layout(
  'Acesso',
  'Seu link de acesso. 🔑',
  `<p class="greet">Olá!</p>
  <p class="bt">Clique no botão abaixo para entrar na Muuday. Este é seu link de acesso único — sem senha necessária.</p>
  <div class="ctaw">
    <a href="{{ .ConfirmationURL }}" class="cta">Entrar na Muuday →</a>
    <span class="ctasub">O link expira em 1 hora e só pode ser usado uma vez</span>
  </div>
  <div class="warn"><p>⚠️ Não compartilhe este link. Se não foi você, ignore este email.</p></div>
  <div class="urlbox"><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></div>
  ${signoff()}`
)

// 4. Change email
const changeEmail = layout(
  'Alteração de email',
  'Confirme seu novo email. 📧',
  `<p class="greet">Olá!</p>
  <p class="bt">Recebemos uma solicitação para alterar o email da sua conta Muuday para <strong>{{ .NewEmail }}</strong>.</p>
  <p class="bt">Clique no botão abaixo para confirmar a alteração.</p>
  <div class="ctaw">
    <a href="{{ .ConfirmationURL }}" class="cta">Confirmar novo email →</a>
    <span class="ctasub">O link expira em 24 horas</span>
  </div>
  <div class="warn"><p>⚠️ Se não foi você quem solicitou esta alteração, entre em contato conosco imediatamente em <a href="mailto:${T.contact}" style="color:${T.warnText}">${T.contact}</a>.</p></div>
  <div class="urlbox"><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></div>
  ${signoff()}`
)

// 5. Reset password
const resetPassword = layout(
  'Segurança',
  'Redefinir sua senha. 🔒',
  `<p class="greet">Olá!</p>
  <p class="bt">Recebemos uma solicitação para redefinir a senha da sua conta Muuday. Clique no botão abaixo para criar uma nova senha.</p>
  <div class="ctaw">
    <a href="{{ .ConfirmationURL }}" class="cta">Criar nova senha →</a>
    <span class="ctasub">O link expira em 1 hora</span>
  </div>
  <div class="warn"><p>⚠️ Se não foi você quem solicitou a redefinição, ignore este email. Sua senha não será alterada.</p></div>
  <div class="urlbox"><a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a></div>
  ${signoff()}`
)

// 6. Reauthentication (OTP code)
const reauthentication = layout(
  'Verificação',
  'Código de verificação. 🔐',
  `<p class="greet">Olá!</p>
  <p class="bt">Use o código abaixo para confirmar sua identidade na Muuday. Este código é válido por <strong>10 minutos</strong>.</p>
  <div class="otp">
    <span class="otpcode">{{ .Token }}</span>
  </div>
  <div class="warn"><p>⚠️ Nunca compartilhe este código com ninguém. A Muuday jamais pedirá seu código por telefone ou chat.</p></div>
  ${signoff()}`
)

// ─── API Call ──────────────────────────────────────────────────────────────

async function updateTemplates() {
  console.log('\nAtualizando templates de email do Supabase...\n')

  const payload = {
    mailer_subjects_confirmation:   'Ative sua conta na Muuday',
    mailer_templates_confirmation_content: confirmSignup,

    mailer_subjects_invite:         'Você foi convidado para a Muuday 🎉',
    mailer_templates_invite_content: inviteUser,

    mailer_subjects_magic_link:     'Seu link de acesso à Muuday 🔑',
    mailer_templates_magic_link_content: magicLink,

    mailer_subjects_email_change:   'Confirme seu novo email na Muuday',
    mailer_templates_email_change_content: changeEmail,

    mailer_subjects_recovery:       'Redefinir senha na Muuday',
    mailer_templates_recovery_content: resetPassword,

    mailer_subjects_reauthentication: 'Código de verificação Muuday',
    mailer_templates_reauthentication_content: reauthentication,
  }

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    const body = await res.text()
    console.error(`❌ Erro ${res.status}: ${body}`)
    process.exit(1)
  }

  const data = await res.json()
  console.log('✅ Templates atualizados com sucesso!\n')
  console.log('Templates atualizados:')
  console.log('  ✅ Confirmar cadastro (Confirm sign up)')
  console.log('  ✅ Convite (Invite user)')
  console.log('  ✅ Link mágico (Magic link)')
  console.log('  ✅ Alterar email (Change email address)')
  console.log('  ✅ Redefinir senha (Reset password)')
  console.log('  ✅ Reautenticação / OTP (Reauthentication)')
  console.log()

  // Verify by showing the subjects that got saved
  if (data.mailer_subjects_confirmation) {
    console.log('Assuntos configurados:')
    console.log(`  Cadastro:   ${data.mailer_subjects_confirmation}`)
    console.log(`  Convite:    ${data.mailer_subjects_invite}`)
    console.log(`  Link mágico: ${data.mailer_subjects_magic_link}`)
    console.log(`  Alt. email: ${data.mailer_subjects_email_change}`)
    console.log(`  Senha:      ${data.mailer_subjects_recovery}`)
    console.log(`  Reauth:     ${data.mailer_subjects_reauthentication}`)
  }
  console.log()
}

updateTemplates().catch(console.error)
