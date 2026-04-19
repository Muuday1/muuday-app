import { sendEmail } from '@/lib/email/client'
import { emailLayout, cta, signoff, from } from '@/lib/email/theme'
import { APP_URL } from '@/lib/email/theme'

// ─── 12. Nova avaliação (profissional) ────────────────────────────────────
export async function sendNewReviewEmail(
  to: string, professionalName: string,
  clientName: string, rating: number, comment: string,
) {
  const stars = '⭐'.repeat(rating)
  return sendEmail({
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
