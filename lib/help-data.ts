import {
  Search,
  CalendarDays,
  CreditCard,
  Video,
  UserCircle,
  ShieldCheck,
  MessageCircle,
  Star,
  BadgeCheck,
  Banknote,
  Clock,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export type HelpArticle = {
  slug: string
  title: string
  content: string
}

export type HelpCollection = {
  slug: string
  title: string
  description: string
  icon: LucideIcon
  articles: HelpArticle[]
}

export const HELP_COLLECTIONS: HelpCollection[] = [
  {
    slug: 'usuarios',
    title: 'Para quem busca',
    description: 'Aprenda a encontrar profissionais, agendar sessões, gerenciar pagamentos e aproveitar ao máximo a plataforma.',
    icon: Search,
    articles: [
      {
        slug: 'como-buscar-profissionais',
        title: 'Como buscar profissionais',
        content: `
<h2>Como funciona a busca</h2>
<p>A busca na Muuday é pública e não exige cadastro. Você pode filtrar por especialidade, idioma, país e disponibilidade. Use a barra de busca na página inicial ou acesse diretamente <strong>/buscar</strong>.</p>

<h2>Filtros disponíveis</h2>
<ul>
<li><strong>Especialidade:</strong> escolha entre psicologia, nutrição, direito, contabilidade, coaching e outras áreas.</li>
<li><strong>Idioma:</strong> encontre profissionais que falem português, inglês, espanhol ou francês.</li>
<li><strong>País:</strong> filtre profissionais que atendem clientes no seu país de residência.</li>
<li><strong>Disponibilidade:</strong> veja apenas profissionais com horários compatíveis com sua agenda.</li>
</ul>

<h2>Dicas para escolher</h2>
<p>Leia a descrição do perfil, veja o vídeo de apresentação e consulte as avaliações de outros clientes. Compare preços e formas de atendimento antes de agendar.</p>
        `.trim(),
      },
      {
        slug: 'como-criar-uma-conta',
        title: 'Como criar uma conta',
        content: `
<h2>Cadastro rápido</h2>
<p>Clique em "Cadastrar" no menu superior. Você pode criar uma conta com e-mail e senha ou usar sua conta Google. O processo leva menos de um minuto.</p>

<h2>Tipos de conta</h2>
<p>Existem dois tipos de conta na Muuday:</p>
<ul>
<li><strong>Usuário:</strong> para quem busca e agenda serviços com profissionais.</li>
<li><strong>Profissional:</strong> para quem oferece serviços e atende pela plataforma.</li>
</ul>
<p>Escolha o tipo adequado no momento do cadastro. Se precisar, você pode criar uma segunda conta com outro e-mail.</p>

<h2>Após o cadastro</h2>
<p>Complete seu perfil adicionando nome, foto e preferências de idioma e moeda. Isso melhora sua experiência na plataforma.</p>
        `.trim(),
      },
      {
        slug: 'como-agendar-uma-sessao',
        title: 'Como agendar uma sessão',
        content: `
<h2>Escolhendo o profissional</h2>
<p>Após encontrar o profissional ideal, acesse o perfil dele e clique em "Agendar". Você verá a agenda com os horários disponíveis.</p>

<h2>Selecionando data e hora</h2>
<p>Os horários são exibidos no <strong>seu fuso horário</strong> automaticamente. Escolha o dia e horário que funcionam para você. O sistema converte automaticamente para o fuso do profissional.</p>

<h2>Tipos de sessão</h2>
<ul>
<li><strong>Consulta única:</strong> uma sessão avulsa, ideal para avaliação.</li>
<li><strong>Pacote:</strong> múltiplas sessões com desconto (quando oferecido pelo profissional).</li>
<li><strong>Recorrente:</strong> agendamento semanal ou quinzenal automático.</li>
</ul>

<h2>Confirmação</h2>
<p>Após selecionar, revise os dados e confirme o pagamento. Você receberá um e-mail de confirmação com o link da videochamada.</p>
        `.trim(),
      },
      {
        slug: 'fuso-horario-e-agendamento',
        title: 'Fuso horário e agendamento',
        content: `
<h2>Como funciona a conversão de fuso</h2>
<p>A Muuday detecta automaticamente o fuso horário do seu dispositivo. Todos os horários exibidos na busca e na agenda estão no <strong>seu fuso horário local</strong>.</p>

<h2>Exemplo prático</h2>
<p>Se você está em Lisboa (UTC+1) e o profissional está em São Paulo (UTC-3), ao escolher 14h em seu horário local, o profissional recebe o agendamento para 10h dele. A conversão é automática — você não precisa calcular nada.</p>

<h2>Horário de verão</h2>
<p>O sistema respeita as regras de horário de verão de cada país. Se houver mudança de fuso durante o período agendado, você receberá uma notificação com o horário atualizado.</p>

<h2>Alterando seu fuso</h2>
<p>Se você viajar para outro fuso, os horários já agendados serão convertidos automaticamente. Verifique sempre a confirmação por e-mail antes da sessão.</p>
        `.trim(),
      },
      {
        slug: 'pagamentos-e-reembolsos',
        title: 'Pagamentos e reembolsos',
        content: `
<h2>Métodos de pagamento</h2>
<p>A Muuday aceita:</p>
<ul>
<li><strong>Cartão de crédito:</strong> parcelamento em até 12x (sujeito à política do profissional).</li>
<li><strong>Cartão de débito:</strong> à vista, processamento imediato.</li>
<li><strong>Pix:</strong> pagamento instantâneo, confirmação em segundos.</li>
<li><strong>Boleto:</strong> disponível para alguns profissionais.</li>
</ul>

<h2>Quando o pagamento é cobrado</h2>
<p>O valor é autorizado no momento do agendamento e <strong>só é liberado para o profissional após a realização da sessão</strong>. Isso protege tanto você quanto o profissional.</p>

<h2>Reembolsos</h2>
<p>Você pode solicitar reembolso em até 48 horas após uma sessão cancelada (ou conforme a política de cancelamento do profissional). O valor é devolvido ao mesmo método de pagamento em até 7 dias úteis.</p>

<h2>Nota fiscal</h2>
<p>O profissional é responsável por emitir nota fiscal quando aplicável. Entre em contato diretamente se precisar do documento.</p>
        `.trim(),
      },
      {
        slug: 'como-funciona-a-videochamada',
        title: 'Como funciona a videochamada',
        content: `
<h2>Acesso à sessão</h2>
<p>Na hora agendada, acesse o link da videochamada enviado por e-mail ou diretamente na página "Minha Agenda" no dashboard. <strong>Não é necessário instalar nenhum aplicativo</strong> — funciona diretamente no navegador.</p>

<h2>Tecnologia</h2>
<p>Usamos videochamada de alta qualidade integrada à plataforma. Recomendamos:</p>
<ul>
<li>Conexão estável de internet (mínimo 2 Mbps).</li>
<li>Navegador atualizado (Chrome, Firefox, Safari ou Edge).</li>
<li>Câmera e microfone funcionando.</li>
</ul>

<h2>Antes da sessão</h2>
<p>Entre na sala de espera 5 minutos antes do horário. Teste sua câmera e áudio. O profissional será notificado quando você entrar.</p>

<h2>Problemas técnicos</h2>
<p>Se houver falha na conexão, tente recarregar a página. Em caso de interrupção prolongada, entre em contato com o suporte para reagendamento ou reembolso.</p>
        `.trim(),
      },
      {
        slug: 'cancelamento-e-remarcacao',
        title: 'Cancelamento e remarcação',
        content: `
<h2>Política de cancelamento</h2>
<p>Cada profissional define sua própria política de cancelamento. Você pode visualizá-la no perfil antes de agendar. Geralmente, cancelamentos com mais de 24h de antecedência garantem reembolso integral.</p>

<h2>Como cancelar</h2>
<p>Acesse "Minha Agenda", localize a sessão e clique em "Cancelar". O reembolso será processado automaticamente conforme a política do profissional.</p>

<h2>Remarcação</h2>
<p>Você pode remarcar uma sessão diretamente na agenda, desde que haja horários disponíveis. A remarcação segue as mesmas regras de cancelamento.</p>

<h2>No-show (não comparecimento)</h2>
<p>Se você não comparecer à sessão sem aviso prévio, o valor pode não ser reembolsado. Sempre cancele com antecedência quando possível.</p>
        `.trim(),
      },
      {
        slug: 'avaliacoes-e-feedback',
        title: 'Avaliações e feedback',
        content: `
<h2>Avaliando o profissional</h2>
<p>Após cada sessão, você recebe um convite para avaliar o profissional. A avaliação inclui nota de 1 a 5 estrelas e um comentário opcional.</p>

<h2>Importância das avaliações</h2>
<p>Sua avaliação ajuda outros usuários a escolherem profissionais e ajuda o profissional a melhorar seu atendimento. Seja honesto e construtivo.</p>

<h2>Privacidade</h2>
<p>As avaliações são públicas, mas seu nome completo não aparece — apenas seu primeiro nome e inicial do sobrenome.</p>

<h2>Editar ou excluir avaliação</h2>
<p>Você pode editar sua avaliação em até 30 dias após a sessão. Depois disso, ela fica definitiva.</p>
        `.trim(),
      },
      {
        slug: 'favoritos-e-listas',
        title: 'Favoritos e listas',
        content: `
<h2>Salvando profissionais</h2>
<p>Encontrou um profissional interessante mas ainda não quer agendar? Clique no ícone de coração no perfil dele para salvar nos favoritos.</p>

<h2>Acessando favoritos</h2>
<p>Seus favoritos ficam disponíveis na página "Favoritos" no menu principal. Você pode remover um profissional da lista a qualquer momento.</p>

<h2>Comparando perfis</h2>
<p>Use a lista de favoritos para comparar preços, avaliações e disponibilidade de diferentes profissionais antes de decidir.</p>
        `.trim(),
      },
      {
        slug: 'mensagens-com-profissionais',
        title: 'Mensagens com profissionais',
        content: `
<h2>Enviando mensagens</h2>
<p>Você pode enviar mensagens para um profissional antes de agendar. Use o botão "Enviar mensagem" no perfil dele. É útil para tirar dúvidas sobre o atendimento.</p>

<h2>Resposta do profissional</h2>
<p>O profissional recebe a notificação e responde pelo chat da plataforma. Você é notificado por e-mail quando houver resposta.</p>

<h2>Limites</h2>
<p>Para evitar spam, há um limite de mensagens não respondidas por profissional. Agende uma sessão para conversas mais aprofundadas.</p>
        `.trim(),
      },
      {
        slug: 'seguranca-e-privacidade',
        title: 'Segurança e privacidade',
        content: `
<h2>Dados protegidos</h2>
<p>A Muuday segue as diretrizes da <strong>LGPD</strong> (Brasil) e do <strong>GDPR</strong> (União Europeia). Seus dados pessoais são criptografados em trânsito e em repouso.</p>

<h2>Pagamento seguro</h2>
<p>Os pagamentos são processados por gateways certificados (PCI-DSS). A Muuday não armazena os dados completos do seu cartão.</p>

<h2>Sessões privadas</h2>
<p>A videochamada é criptografada ponta a ponta. Ninguém além de você e o profissional pode acessar o conteúdo da sessão.</p>

<h2>Denúncias</h2>
<p>Se você identificar comportamento inadequado de um profissional, denuncie pelo perfil dele ou entre em contato com o suporte. Todas as denúncias são investigadas.</p>
        `.trim(),
      },
      {
        slug: 'problemas-tecnicos-na-sessao',
        title: 'Problemas técnicos na sessão',
        content: `
<h2>Conexão instável</h2>
<p>Se a imagem travar ou o áudio falhar, tente:</p>
<ul>
<li>Recarregar a página da sessão.</li>
<li>Fechar abas e aplicativos que estejam usando a internet.</li>
<li>Usar cabo de rede em vez de Wi-Fi, se possível.</li>
</ul>

<h2>Microfone ou câmera não funcionam</h2>
<p>Verifique se o navegador tem permissão para acessar câmera e microfone. No Chrome, clique no ícone de cadeado na barra de endereço e confirme as permissões.</p>

<h2>Sessão interrompida</h2>
<p>Se a sessão for interrompida por mais de 5 minutos por problemas técnicos, entre em contato com o suporte para solicitar reagendamento ou reembolso.</p>
        `.trim(),
      },
    ],
  },
  {
    slug: 'profissionais',
    title: 'Para quem atende',
    description: 'Tudo sobre como criar seu perfil, configurar serviços, receber pagamentos e gerenciar sua agenda na Muuday.',
    icon: BadgeCheck,
    articles: [
      {
        slug: 'como-criar-seu-perfil',
        title: 'Como criar seu perfil',
        content: `
<h2>Cadastro inicial</h2>
<p>Acesse <strong>/registrar-profissional</strong> e clique em "Criar perfil grátis". Você precisará de um e-mail válido e documento de identificação.</p>

<h2>Informações obrigatórias</h2>
<ul>
<li><strong>Nome completo:</strong> como consta em seu documento.</li>
<li><strong>Formação:</strong> instituição, curso e ano de conclusão.</li>
<li><strong>Especialidade:</strong> área principal de atuação.</li>
<li><strong>Documentos:</strong> certificado de formação ou registro profissional.</li>
</ul>

<h2>Foto e vídeo</h2>
<p>Adicione uma foto profissional de rosto e, opcionalmente, um vídeo de até 2 minutos se apresentando. Perfis com vídeo recebem até 3x mais visualizações.</p>

<h2>Bio e descrição</h2>
<p>Escreva uma bio clara e objetiva. Destaque sua experiência, formas de atendimento e o que diferencia você. Evite jargões — pense no cliente brasileiro no exterior.</p>
        `.trim(),
      },
      {
        slug: 'verificacao-e-aprovacao',
        title: 'Verificação e aprovação',
        content: `
<h2>Processo de análise</h2>
<p>Após enviar seu cadastro, nossa equipe revisa seus dados em até <strong>48 horas úteis</strong>. Verificamos:</p>
<ul>
<li>Autenticidade dos documentos.</li>
<li>Completude do perfil.</li>
<li>Clareza da bio e descrição dos serviços.</li>
<li>Qualidade da foto e vídeo (se houver).</li>
</ul>

<h2>Status da aplicação</h2>
<p>Você pode acompanhar o status pelo dashboard. Os status são:</p>
<ul>
<li><strong>Em análise:</strong> aguardando revisão da equipe.</li>
<li><strong>Aprovado:</strong> seu perfil está público e você pode receber agendamentos.</li>
<li><strong>Pendente:</strong> falta alguma informação ou documento.</li>
<li><strong>Reprovado:</strong> não atendeu aos critérios. Você pode reaplicar.</li>
</ul>

<h2>Dicas para aprovação rápida</h2>
<p>Preencha todos os campos, use documentos legíveis e escreva uma bio clara. Perfis incompletos demoram mais para serem aprovados.</p>
        `.trim(),
      },
      {
        slug: 'configurar-servicos-e-precos',
        title: 'Configurar serviços e preços',
        content: `
<h2>Criando um serviço</h2>
<p>No dashboard, acesse "Serviços" e clique em "Novo serviço". Cada serviço precisa ter:</p>
<ul>
<li><strong>Nome:</strong> exemplo: "Consulta de Psicologia".</li>
<li><strong>Duração:</strong> tempo da sessão em minutos.</li>
<li><strong>Preço:</strong> valor em reais (R$).</li>
<li><strong>Descrição:</strong> o que está incluído na sessão.</li>
</ul>

<h2>Preços e pacotes</h2>
<p>Você pode oferecer:</p>
<ul>
<li><strong>Sessão avulsa:</strong> preço normal.</li>
<li><strong>Pacote:</strong> 4 ou mais sessões com desconto.</li>
<li><strong>Primeira consulta:</strong> preço promocional para novos clientes.</li>
</ul>

<h2>Moeda</h2>
<p>Todos os preços são em reais (BRL). O cliente vê o valor convertido para a moeda local dele automaticamente.</p>
        `.trim(),
      },
      {
        slug: 'definir-disponibilidade',
        title: 'Definir disponibilidade',
        content: `
<h2>Configurando sua agenda</h2>
<p>Acesse "Disponibilidade" no dashboard. Clique nos dias e horários em que você pode atender. Você pode definir horários diferentes para cada dia da semana.</p>

<h2>Fuso horário</h2>
<p>Defina seu fuso horário principal. O sistema converte automaticamente para o fuso do cliente. Se você viajar, atualize seu fuso para manter os agendamentos corretos.</p>

<h2>Duração e intervalos</h2>
<p>Configure o tempo de duração das sessões e o intervalo entre elas. Isso evita agendamentos em sequência sem tempo para descanso.</p>

<h2>Indisponibilidade</h2>
<p>Marque dias específicos como indisponíveis (férias, feriados, compromissos). Os clientes não conseguirão agendar nesses dias.</p>
        `.trim(),
      },
      {
        slug: 'regras-de-cancelamento',
        title: 'Regras de cancelamento',
        content: `
<h2>Política padrão</h2>
<p>Você define sua própria política de cancelamento. Recomendamos:</p>
<ul>
<li><strong>Cancelamento com mais de 24h:</strong> reembolso integral ao cliente.</li>
<li><strong>Cancelamento com menos de 24h:</strong> retenção de 50% do valor.</li>
<li><strong>No-show do cliente:</strong> você recebe o valor integral.</li>
</ul>

<h2>Como configurar</h2>
<p>Na seção "Configurações de Agendamento", defina os prazos e percentuais de reembolso. A política fica visível no seu perfil para os clientes.</p>

<h2>Cancelamento por parte do profissional</h2>
<p>Se você precisar cancelar, faça o quanto antes. Cancelamentos frequentes de última hora afetam sua reputação e visibilidade na busca.</p>
        `.trim(),
      },
      {
        slug: 'como-funciona-o-pagamento',
        title: 'Como funciona o pagamento',
        content: `
<h2>Ciclo de recebimento</h2>
<p>Quando um cliente agenda uma sessão com você, o valor é reservado na plataforma. Após a sessão ser realizada, o dinheiro é liberado para sua conta em até <strong>48 horas</strong>.</p>

<h2>Taxas</h2>
<p>A Muuday retém uma taxa de processamento sobre cada transação. O percentual exato varia conforme seu plano:</p>
<ul>
<li><strong>Plano Gratuito:</strong> taxa padrão.</li>
<li><strong>Plano Pro:</strong> taxa reduzida + benefícios extras.</li>
</ul>

<h2>Saque</h2>
<p>Conecte sua conta PayPal no menu "Financeiro" para receber seus repasses. Você pode solicitar saque quando atingir o valor mínimo de R$ 50,00. O prazo de transferência é de 1 a 3 dias úteis.</p>

<h2>Nota fiscal</h2>
<p>Você é responsável por emitir nota fiscal quando exigido por lei. Recomendamos consultar seu contador sobre as obrigações fiscais para renda obtida por plataformas digitais.</p>
        `.trim(),
      },
      {
        slug: 'taxas-e-comissionamento',
        title: 'Taxas e comissionamento',
        content: `
<h2>Taxa de processamento</h2>
<p>A plataforma retém uma porcentagem sobre cada transação para cobrir custos de pagamento, infraestrutura e suporte. O valor exato é exibido transparentemente antes de você confirmar cada preço.</p>

<h2>Planos para profissionais</h2>
<p>Oferecemos planos que reduzem a taxa e adicionam benefícios:</p>
<ul>
<li><strong>Básico:</strong> taxa padrão, perfil público.</li>
<li><strong>Destaque:</strong> taxa reduzida, prioridade na busca.</li>
<li><strong>Premium:</strong> menor taxa, badge de verificado, destaque no carousel.</li>
</ul>

<h2>Sem mensalidade obrigatória</h2>
<p>Você só paga quando recebe um pagamento. Não há custo fixo para manter o perfil ativo.</p>
        `.trim(),
      },
      {
        slug: 'videochamada-integrada',
        title: 'Videochamada integrada',
        content: `
<h2>Como funciona</h2>
<p>A Muuday possui videochamada própria, sem necessidade de Zoom, Teams ou WhatsApp. O cliente acessa o link diretamente na plataforma, e você também.</p>

<h2>Qualidade e recursos</h2>
<ul>
<li><strong>Resolução HD:</strong> imagem nítida para sessões profissionais.</li>
<li><strong>Chat durante a sessão:</strong> envie links ou anotações em tempo real.</li>
<li><strong>Compartilhamento de tela:</strong> útil para apresentações e documentos.</li>
<li><strong>Gravação:</strong> disponível com consentimento de ambas as partes.</li>
</ul>

<h2>Requisitos técnicos</h2>
<p>Use um navegador atualizado e conexão estável. Recomendamos fazer um teste de chamada antes da primeira sessão para verificar câmera e microfone.</p>
        `.trim(),
      },
      {
        slug: 'chat-com-clientes',
        title: 'Chat com clientes',
        content: `
<h2>Mensagens antes da sessão</h2>
<p>O chat integrado permite que você troque mensagens com o cliente antes e depois das sessões. Use para tirar dúvidas, enviar orientações ou receber feedback.</p>

<h2>Notificações</h2>
<p>Você recebe notificações por e-mail e push quando um cliente enviar mensagem. Responda em até 24 horas para manter uma boa reputação.</p>

<h2>Limite de mensagens</h2>
<p>Para evitar uso indevido, o chat gratuito é limitado a trocas antes do primeiro agendamento. Após a primeira sessão, o chat fica ilimitado para aquele cliente.</p>
        `.trim(),
      },
      {
        slug: 'avaliacoes-e-reputacao',
        title: 'Avaliações e reputação',
        content: `
<h2>Como funcionam as avaliações</h2>
<p>Após cada sessão, o cliente pode avaliar você com nota de 1 a 5 estrelas e um comentário. Avaliações positivas aumentam sua visibilidade na busca.</p>

<h2>Responder avaliações</h2>
<p>Você pode responder publicamente a cada avaliação. Use isso para agradecer feedbacks positivos ou esclarecer questões em avaliações negativas.</p>

<h2>Impacto na busca</h2>
<p>Profissionais com média acima de 4.5 estrelas aparecem primeiro nos resultados. Mantenha a qualidade do atendimento para se destacar.</p>

<h2>Avaliações injustas</h2>
<p>Se considerar uma avaliação injusta ou ofensiva, você pode denunciá-la. Nossa equipe analisa e remove avaliações que violem as diretrizes da comunidade.</p>
        `.trim(),
      },
      {
        slug: 'visibilidade-na-busca',
        title: 'Visibilidade na busca',
        content: `
<h2>Como funciona o ranking</h2>
<p>A ordem dos resultados na busca é determinada por vários fatores:</p>
<ul>
<li><strong>Avaliações:</strong> nota média e quantidade de avaliações.</li>
<li><strong>Completude do perfil:</strong> perfis 100% preenchidos ranqueiam melhor.</li>
<li><strong>Disponibilidade:</strong> profissionais com mais horários disponíveis aparecem mais.</li>
<li><strong>Resposta rápida:</strong> quem responde mensagens e agendamentos mais rápido ganha pontos.</li>
<li><strong>Plano:</strong> assinantes dos planos Destaque e Premium têm prioridade.</li>
</ul>

<h2>Dicas para aparecer mais</h2>
<p>Mantenha sua agenda atualizada, responda mensagens em até 24h, peça para clientes satisfeitos deixarem avaliações e mantenha seu perfil completo com foto e vídeo.</p>
        `.trim(),
      },
      {
        slug: 'editar-perfil-e-fotos',
        title: 'Editar perfil e fotos',
        content: `
<h2>Atualizando informações</h2>
<p>Acesse "Editar Perfil Profissional" no dashboard. Você pode alterar sua bio, foto, vídeo, especialidades e preços a qualquer momento.</p>

<h2>Melhores práticas para foto</h2>
<ul>
<li>Use uma foto de rosto bem iluminada.</li>
<li>Fundo limpo e neutro.</li>
<li>Expressão profissional e acolhedora.</li>
<li>Evite óculos escuros ou chapéus que escondam o rosto.</li>
</ul>

<h2>Vídeo de apresentação</h2>
<p>Grave um vídeo curto (30-60 segundos) se apresentando. Fale sua especialidade, experiência e como você pode ajudar o cliente. Perfis com vídeo convertem 3x mais.</p>
        `.trim(),
      },
      {
        slug: 'prontuario-e-anotacoes',
        title: 'Prontuário e anotações',
        content: `
<h2>Anotações por cliente</h2>
<p>Na seção "Prontuário", você pode fazer anotações privadas sobre cada cliente. Somente você tem acesso a essas informações.</p>

<h2>Organização</h2>
<p>As anotações são organizadas por cliente e por sessão. Use para registrar observações, evoluções e planos de tratamento ou acompanhamento.</p>

<h2>Privacidade</h2>
<p>As anotações são criptografadas e acessíveis apenas pela sua conta. O cliente não vê o conteúdo do prontuário.</p>
        `.trim(),
      },
      {
        slug: 'disputas-e-suporte',
        title: 'Disputas e suporte',
        content: `
<h2>Quando abrir uma disputa</h2>
<p>Se houver desentendimento sobre pagamento, qualidade do atendimento ou no-show, você pode abrir uma disputa em até 7 dias após a sessão.</p>

<h2>Processo de disputa</h2>
<ol>
<li>Acesse "Disputas" no dashboard e clique em "Nova disputa".</li>
<li>Descreva o problema e anexe evidências (prints, conversas, etc.).</li>
<li>Nossa equipe analisa em até 5 dias úteis.</li>
<li>A decisão é enviada por e-mail e aplicada automaticamente.</li>
</ol>

<h2>Prevenção</h2>
<p>Mantenha comunicação clara com o cliente, documente acordos no chat e siga as políticas da plataforma. A maioria das disputas pode ser evitada com boa comunicação.</p>
        `.trim(),
      },
      {
        slug: 'planos-e-assinaturas',
        title: 'Planos e assinaturas',
        content: `
<h2>Planos disponíveis</h2>
<p>A Muuday oferece planos para profissionais que querem mais visibilidade e menores taxas:</p>

<h3>Básico (Gratuito)</h3>
<ul>
<li>Perfil público na busca.</li>
<li>Taxa padrão por transação.</li>
<li>Suporte por e-mail.</li>
</ul>

<h3>Destaque</h3>
<ul>
<li>Taxa reduzida em 2%.</li>
<li>Prioridade no ranking de busca.</li>
<li>Badge de "Profissional Destaque".</li>
<li>Suporte prioritário.</li>
</ul>

<h3>Premium</h3>
<ul>
<li>Menor taxa da plataforma.</li>
<li>Destaque no carousel da homepage.</li>
<li>Badge "Premium" dourado.</li>
<li>Gerente de conta dedicado.</li>
<li>Acesso antecipado a novos recursos.</li>
</ul>

<h2>Como assinar</h2>
<p>Acesse "Planos" no dashboard, escolha o plano e finalize o pagamento. Você pode cancelar a assinatura a qualquer momento sem multa.</p>
        `.trim(),
      },
      {
        slug: 'nota-fiscal-e-impostos',
        title: 'Nota fiscal e impostos',
        content: `
<h2>Obrigação do profissional</h2>
<p>Você é responsável por emitir nota fiscal quando exigido por lei. A Muuday não emite nota fiscal em nome do profissional.</p>

<h2>Recomendações</h2>
<ul>
<li>Consulte um contador sobre a melhor forma de se regularizar (MEI, PJ, etc.).</li>
<li>Mantenha registros de todos os pagamentos recebidos.</li>
<li>Declare a renda obtida pela plataforma no imposto de renda.</li>
</ul>

<h2>Informações para contabilidade</h2>
<p>No menu "Financeiro", você pode exportar um relatório mensal com todos os pagamentos recebidos, taxas e dados para contabilidade.</p>
        `.trim(),
      },
    ],
  },
]

export function getCollectionBySlug(slug: string): HelpCollection | undefined {
  return HELP_COLLECTIONS.find((c) => c.slug === slug)
}

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  for (const collection of HELP_COLLECTIONS) {
    const article = collection.articles.find((a) => a.slug === slug)
    if (article) return article
  }
  return undefined
}

export function getArticleCollection(slug: string): HelpCollection | undefined {
  for (const collection of HELP_COLLECTIONS) {
    const article = collection.articles.find((a) => a.slug === slug)
    if (article) return collection
  }
  return undefined
}

export function getAllArticles(): (HelpArticle & { collectionSlug: string; collectionTitle: string })[] {
  return HELP_COLLECTIONS.flatMap((c) =>
    c.articles.map((a) => ({
      ...a,
      collectionSlug: c.slug,
      collectionTitle: c.title,
    }))
  )
}
