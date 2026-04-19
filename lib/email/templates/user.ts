import { sendEmail } from '@/lib/email/client'
import { emailLayout, cta, signoff, from } from '@/lib/email/theme'
import { APP_URL } from '@/lib/email/theme'

// ─── 1. Boas-vindas ────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
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
      ${cta(`${APP_URL}/buscar`, 'Explorar profissionais →')}
      ${signoff()}`
    ),
  })
}

// ─── 2. Completar conta (social login) ────────────────────────────────────
export async function sendCompleteAccountEmail(to: string, name: string) {
  return sendEmail({
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

// ——— 27. Recuperação de senha (auth fallback via Resend) ————————————————
export async function sendPasswordResetEmail(to: string, actionLink: string) {
  return sendEmail({
    from: from(),
    to,
    subject: 'Redefina sua senha da Muuday',
    html: emailLayout(
      'Segurança',
      'Redefina sua senha com segurança.',
      `<p class="greet">Olá,</p>
      <p class="bt">Recebemos uma solicitação para redefinir a senha da sua conta Muuday.</p>
      <p class="bt">Se foi você, use o botão abaixo para continuar:</p>
      ${cta(actionLink, 'Redefinir minha senha')}
      <div class="warn">
        <p>Este link expira em breve. Se você não solicitou esta ação, ignore este e-mail.</p>
      </div>
      <p class="bt">Se o botão não abrir, copie e cole este link no navegador:</p>
      <p class="bt" style="word-break:break-all;font-size:13px;color:#5c5a52;">${actionLink}</p>
      ${signoff()}`,
    ),
  })
}
