import { sendEmail } from '@/lib/email/client'
import { emailLayout, cta, signoff, from } from '@/lib/email/theme'
import { APP_URL } from '@/lib/email/theme'

// ─── 15. Newsletter / Novidades e promoções ───────────────────────────────
export async function sendNewsletterEmail(
  to: string, name: string,
  subject: string, badge: string, headline: string, body: string,
  ctaLabel: string, ctaUrl: string, ctaSub?: string,
) {
  return sendEmail({
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

// ─── 19. Confirmação lista de espera (landing page) ───────────────────────
export async function sendWaitlistConfirmationEmail(to: string, name: string) {
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
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
  return sendEmail({
    from: from(), to,
    subject: `${name}, já encontrou seu profissional? 🔍`,
    html: emailLayout(
      'Próximo passo',
      'Está tudo pronto para sua primeira sessão.',
      `<p class="greet">Olá, ${name}!</p>
      <p class="bt">Você criou sua conta há alguns dias mas ainda não agendou sua primeira sessão. Está tudo pronto — leva menos de 2 minutos para encontrar e reservar com um profissional.</p>
      <div class="hbox"><p>Mais de X profissionais brasileiros estão disponíveis agora. Você pode filtrar por especialidade, idioma e horário.</p></div>
      ${cta(`${APP_URL}/buscar`, 'Ver profissionais disponíveis →')}
      ${signoff()}`
    ),
  })
}

// ─── 25. Re-engajamento (30 dias sem login) ───────────────────────────────
export async function sendReengagementEmail(to: string, name: string) {
  return sendEmail({
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
      ${cta(`${APP_URL}/buscar`, 'Voltar para a Muuday →')}
      ${signoff()}`
    ),
  })
}

// ─── 26. Email de lançamento (para lista de espera) ───────────────────────
export async function sendLaunchEmail(to: string, name: string) {
  return sendEmail({
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
