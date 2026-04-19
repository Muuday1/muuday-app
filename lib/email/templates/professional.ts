import { sendEmail } from '@/lib/email/client'
import { emailLayout, cta, signoff, from } from '@/lib/email/theme'
import { APP_URL } from '@/lib/email/theme'

// ─── 13. Perfil aprovado (profissional) ───────────────────────────────────
export async function sendProfileApprovedEmail(to: string, professionalName: string) {
  return sendEmail({
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
export async function sendProfileNeedsChangesEmail(
  to: string, professionalName: string, notes: string,
) {
  return sendEmail({
    from: from(), to,
    subject: `Seu perfil precisa de ajustes na Muuday`,
    html: emailLayout(
      'Ajustes necessarios',
      'Seu perfil precisa de ajustes antes da publicacao.',
      `<p class="greet">Ola, ${professionalName}!</p>
      <p class="bt">Sua solicitacao foi revisada e precisamos de alguns ajustes antes de liberar seu perfil.</p>
      <div class="danger">
        <p style="font-weight:600;margin-bottom:6px;">Ajustes solicitados:</p>
        <p>${notes}</p>
      </div>
      <p class="bt">Assim que voce atualizar, envie novamente para revisao.</p>
      ${cta(`${APP_URL}/editar-perfil-profissional`, 'Atualizar meu perfil ->')}
      ${signoff()}`
    ),
  })
}

export async function sendProfileRejectedEmail(
  to: string, professionalName: string, reason: string,
) {
  return sendEmail({
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
      ${cta(`${APP_URL}/editar-perfil-profissional`, 'Atualizar meu perfil →')}
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
  return sendEmail({
    from: from(), to,
    subject: `Seu perfil está incompleto — complete para aparecer nas buscas`,
    html: emailLayout(
      'Ação necessária',
      'Complete seu perfil para ser encontrado.',
      `<p class="greet">Olá, ${professionalName}!</p>
      <p class="bt">Seu perfil ainda está incompleto. Perfis completos aparecem nas buscas e convertem muito mais clientes.</p>
      <p class="bt" style="font-weight:600;color:#1e1d18;">O que ainda falta:</p>
      <ul class="flist">${items}</ul>
      ${cta(`${APP_URL}/editar-perfil-profissional`, 'Completar meu perfil →', 'Leva menos de 5 minutos')}
      ${signoff()}`
    ),
  })
}
