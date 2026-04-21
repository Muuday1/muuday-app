export type ProfessionalTermKey =
  | 'platform_terms'
  | 'payment_terms'
  | 'privacy_terms'
  | 'regulated_scope_terms'

export type ProfessionalTerm = {
  key: ProfessionalTermKey
  title: string
  version: string
  shortLabel: string
  acceptanceLabel: string
  sections: Array<{ heading: string; body: string }>
}

export const PROFESSIONAL_TERMS: ProfessionalTerm[] = [
  {
    key: 'platform_terms',
    title: 'Termos de Uso da Plataforma Muuday',
    version: '',
    shortLabel: 'Termos de Uso da Plataforma',
    acceptanceLabel: 'Aceito os Termos de Uso',
    sections: [
      {
        heading: 'Preâmbulo e aceite',
        body: 'Estes Termos de Uso constituem contrato juridicamente vinculante entre a Muuday e o profissional prestador de serviços. Ao marcar o checkbox de aceite, concluir cadastro ou usar a plataforma, você declara que leu, compreendeu e concorda integralmente com este documento.',
      },
      {
        heading: 'Objeto e natureza da plataforma',
        body: 'A Muuday atua exclusivamente como intermediadora tecnológica e provedora de aplicação de internet. A Muuday não é prestadora dos serviços profissionais ofertados, nem clínica, escritório jurídico/contábil, instituição financeira, empregadora ou representante legal do profissional.',
      },
      {
        heading: 'Cadastro, elegibilidade e verificação',
        body: 'O profissional deve fornecer dados verdadeiros, completos e atualizados, manter habilitações e registros aplicáveis, e atender verificações de identidade e compliance quando solicitado. É vedado manter contas múltiplas, usar identidade de terceiros ou transferir a conta.',
      },
      {
        heading: 'Conta, credenciais e segurança',
        body: 'As credenciais são pessoais e intransferíveis. O profissional responde integralmente pelas ações realizadas em sua conta e deve comunicar imediatamente qualquer incidente, uso não autorizado ou suspeita de comprometimento.',
      },
      {
        heading: 'Responsabilidades do profissional',
        body: 'O profissional é o único responsável técnica, ética, regulatória, civil, penal, administrativa e tributariamente pelos serviços prestados, incluindo qualidade da execução, conformidade legal, recolhimento de tributos e emissão de documentos fiscais quando aplicável.',
      },
      {
        heading: 'Condutas vedadas',
        body: 'É proibido oferecer serviços ilícitos, praticar discriminação, assédio, fraude reputacional, manipulação de avaliações, uso indevido de dados de clientes, contorno de segurança da plataforma, lavagem de dinheiro e qualquer conduta contrária à lei ou aos presentes Termos.',
      },
      {
        heading: 'Conteúdo e licença de uso',
        body: 'O profissional mantém titularidade sobre seu conteúdo, mas concede à Muuday licença não exclusiva para hospedar, exibir, adaptar e divulgar esse conteúdo para operação e promoção da plataforma, nos limites legais e contratuais aplicáveis.',
      },
      {
        heading: 'Moderação, suspensão e encerramento',
        body: 'A Muuday pode revisar, solicitar ajustes, limitar funcionalidades, suspender ou encerrar conta em caso de inconsistências, risco regulatório, inadimplência, fraude, denúncias fundamentadas ou violação destes Termos, com ou sem aviso prévio conforme a gravidade.',
      },
      {
        heading: 'Não-circunvenção',
        body: 'É vedado desviar clientes captados pela plataforma para contratação direta fora da Muuday com objetivo de evitar taxas da operação. Violações podem gerar multa contratual, bloqueio de conta e demais medidas cabíveis, sem prejuízo de perdas e danos.',
      },
      {
        heading: 'Limitação de responsabilidade e indenização',
        body: 'A Muuday não responde pela execução do serviço profissional e não garante disponibilidade ininterrupta. O profissional concorda em indenizar a Muuday por danos e reclamações decorrentes de sua atuação, nos termos da legislação aplicável.',
      },
      {
        heading: 'Lei aplicável e foro',
        body: 'Aplica-se a legislação da República Federativa do Brasil. Fica eleito o foro da Comarca da Capital do Estado de São Paulo/SP, ressalvadas hipóteses de competência legal específica.',
      },
    ],
  },
  {
    key: 'payment_terms',
    title: 'Termos Financeiros: Plano, Cobrança e Payout',
    version: '',
    shortLabel: 'Termos Financeiros',
    acceptanceLabel: 'Li e autorizo a cobrança recorrente',
    sections: [
      {
        heading: 'Preâmbulo e autorização de cobrança recorrente',
        body: 'Este documento rege os aspectos financeiros da relação entre a Muuday e o profissional, incluindo plano, cobrança, taxa da plataforma, pagamentos, payout, tributos, reembolsos e chargebacks. Ao aceitar este termo, o profissional autoriza expressamente a cobrança automática e recorrente do plano no meio de pagamento cadastrado.',
      },
      {
        heading: 'Plano, assinatura e reajustes',
        body: 'O profissional concorda com a modalidade, valor e ciclo de cobrança do plano escolhido. A Muuday poderá reajustar valores de forma periódica ou extraordinária, com comunicação prévia quando aplicável, observadas as condições legais e contratuais vigentes.',
      },
      {
        heading: 'Falha de pagamento e inadimplência',
        body: 'Em caso de falha de cobrança, a Muuday poderá realizar novas tentativas, notificar o profissional, restringir funcionalidades, suspender a conta, aplicar encargos moratórios, promover cobrança e compensar débitos com valores eventualmente devidos ao profissional.',
      },
      {
        heading: 'Taxa da plataforma e precificação',
        body: 'O profissional define o preço do serviço em BRL. A taxa da plataforma é adicionada ao checkout do cliente e a Muuday recebe essa taxa, enquanto o profissional recebe o valor do serviço, sujeito apenas às deduções contratuais, legais, fiscais, operacionais e a eventuais retenções por disputa, fraude ou chargeback.',
      },
      {
        heading: 'Intermediador de pagamento e payout',
        body: 'O processamento financeiro e os repasses ao profissional ocorrem por meio do provedor de pagamentos integrado, como Stripe Connect. O payout depende de configuração correta da conta, validações KYC, inexistência de pendências críticas e cumprimento das regras operacionais e antifraude.',
      },
      {
        heading: 'Retenções, compensações e chargebacks',
        body: 'A Muuday e o intermediador de pagamento podem reter ou compensar valores em caso de fraude suspeita, disputa, chargeback, inadimplência, pendência documental, ordem legal ou necessidade de reserva operacional. O profissional concorda com essas hipóteses e com o repasse de custos decorrentes quando aplicável.',
      },
      {
        heading: 'Câmbio, cancelamentos e reembolsos',
        body: 'Conversões de moeda exibidas na plataforma têm caráter referencial e não constituem obrigação cambial da Muuday. Reembolsos, cancelamentos e no-shows seguem as políticas da plataforma e podem impactar os valores elegíveis para payout.',
      },
      {
        heading: 'Tributos, documentos fiscais e atuação internacional',
        body: 'O profissional é o único responsável por seus tributos, obrigações fiscais e emissão de documentos fiscais ou equivalentes. Se atuar com clientes no exterior ou residir fora do Brasil, também assume integralmente as obrigações locais, cambiais e tributárias aplicáveis.',
      },
      {
        heading: 'Demonstrativos e auditoria',
        body: 'A Muuday poderá disponibilizar demonstrativos financeiros e auditar registros relacionados à conta do profissional para fins de compliance, antifraude e verificação de conformidade com este termo e com a operação da plataforma.',
      },
    ],
  },
  {
    key: 'privacy_terms',
    title: 'Política de Privacidade e Proteção de Dados',
    version: '',
    shortLabel: 'Privacidade e Proteção de Dados',
    acceptanceLabel: 'Li e aceito a Política de Privacidade',
    sections: [
      {
        heading: 'Preâmbulo e escopo',
        body: 'Esta Política descreve como a Muuday coleta, utiliza, compartilha, retém e protege dados pessoais do profissional, bem como os direitos assegurados pela legislação aplicável. O aceite deste documento não substitui consentimentos específicos exigidos para finalidades adicionais.',
      },
      {
        heading: 'Papéis e responsabilidades',
        body: 'Em relação aos dados do próprio profissional, a Muuday atua como controladora. Em relação aos dados de clientes tratados pelo profissional em sua atividade-fim, o profissional atua como controlador autônomo e independente, sendo o único responsável por base legal, retenção, segurança e atendimento aos direitos dos titulares.',
      },
      {
        heading: 'Dados tratados e finalidades',
        body: 'A Muuday pode tratar dados cadastrais, profissionais, financeiros, técnicos, de comunicação e de desempenho na plataforma para execução contratual, segurança, prevenção à fraude, cumprimento de obrigações legais e regulatórias, melhoria do produto e exercício regular de direitos.',
      },
      {
        heading: 'Compartilhamento com terceiros',
        body: 'Os dados podem ser compartilhados com intermediadores de pagamento, provedores de infraestrutura, ferramentas operacionais, soluções antifraude, autoridades públicas quando legalmente exigido, parceiros autorizados e empresas do mesmo grupo econômico, sempre com medidas contratuais e técnicas de proteção.',
      },
      {
        heading: 'Transferência internacional, retenção e direitos',
        body: 'Como a operação pode envolver titulares fora do Brasil, os dados podem ser transferidos internacionalmente com salvaguardas adequadas. A retenção observa prazos legais, regulatórios e operacionais, e o profissional pode exercer direitos como acesso, correção, portabilidade, eliminação, oposição e revogação de consentimento nos termos da legislação aplicável.',
      },
      {
        heading: 'Segurança, incidentes e cookies',
        body: 'A Muuday adota medidas técnicas e administrativas razoáveis de segurança, incluindo controles de acesso, criptografia quando aplicável, logs, backups e revisão de fornecedores. Em caso de incidente relevante, a comunicação seguirá os requisitos legais. A plataforma também utiliza cookies e tecnologias similares para autenticação, preferências, analytics, segurança e desempenho.',
      },
      {
        heading: 'Dados de clientes tratados pelo profissional',
        body: 'O profissional, como controlador autônomo dos dados de seus clientes no exercício da atividade-fim, deve tratar esses dados com base legal adequada, manter medidas de segurança compatíveis, atender aos direitos dos titulares e observar sigilo profissional e normas aplicáveis.',
      },
      {
        heading: 'Canais e atualizações',
        body: 'Solicitações sobre privacidade e exercício de direitos podem ser feitas pelos canais oficiais da Muuday. Esta Política pode ser atualizada para refletir mudanças legais, regulatórias, tecnológicas ou operacionais, com comunicação prévia quando exigida por lei.',
      },
    ],
  },
  {
    key: 'regulated_scope_terms',
    title: 'Declaração de Conformidade Regulatória e Escopo Consultivo',
    version: '',
    shortLabel: 'Conformidade Regulatória',
    acceptanceLabel: 'Declaro estar em conformidade regulatória',
    sections: [
      {
        heading: 'Preâmbulo e responsabilidade do profissional',
        body: 'Este documento contém declarações com efeito jurídico sobre licenciamento, ética, jurisdição, prevenção à fraude e conformidade regulatória. Ao aceitar este termo, o profissional declara conhecer e assumir integral responsabilidade pelo cumprimento das regras aplicáveis à sua atividade.',
      },
      {
        heading: 'Escopo consultivo do atendimento',
        body: 'Os atendimentos iniciados pela plataforma possuem, em regra, caráter consultivo, informativo, educacional, orientativo ou de segunda opinião. Eles não substituem atendimento local regulado, presencial ou ato privativo sujeito a licenciamento territorial quando a lei assim exigir.',
      },
      {
        heading: 'Jurisdição, licenciamento e orientação local',
        body: 'O profissional deve respeitar os limites do seu registro profissional, as regras do conselho competente no Brasil e as normas do país onde o cliente se encontra ou onde o serviço é efetivamente prestado. Quando necessário, deve orientar o cliente a buscar atendimento local, especialmente em casos de urgência, atos privativos, documentos com validade territorial ou situações fora do escopo consultivo.',
      },
      {
        heading: 'Não-circunvenção regulatória',
        body: 'É vedado usar a plataforma para contornar, burlar ou fraudar regras regulatórias, de licenciamento ou de escopo profissional em qualquer país. O profissional assume responsabilidade exclusiva por infrações éticas, administrativas, civis ou penais decorrentes de sua atuação.',
      },
      {
        heading: 'Regras específicas por categoria regulada',
        body: 'Profissionais de saúde, jurídico, contabilidade, finanças e demais categorias reguladas devem observar integralmente as normas específicas de seus respectivos conselhos, autoridades e jurisdições aplicáveis, inclusive quanto a teleatendimento, publicidade, aconselhamento, sigilo e limites materiais de atuação.',
      },
      {
        heading: 'Publicidade, sigilo e confidencialidade',
        body: 'Toda comunicação do profissional na plataforma deve respeitar regras éticas, evitar promessa de resultado e observar normas de publicidade profissional. Também se aplica o dever de sigilo e confidencialidade sobre dados e informações do cliente, inclusive após o encerramento da relação.',
      },
      {
        heading: 'Lavagem de dinheiro, anticorrupção e sanções',
        body: 'O profissional se compromete a cumprir as normas de prevenção à lavagem de dinheiro, anticorrupção e sanções internacionais, não podendo operar em benefício de pessoas sancionadas, praticar evasão regulatória ou participar de fluxos ilícitos financeiros ou documentais.',
      },
      {
        heading: 'Declarações, bloqueio preventivo e isenção da Muuday',
        body: 'O profissional declara possuir habilitação regular, não estar suspenso ou impedido e manter documentação atualizada. A Muuday pode bloquear, restringir ou sinalizar perfis e serviços por precaução operacional e não atua como certificadora da conformidade regulatória do profissional, que permanece integralmente responsável por sua atuação.',
      },
    ],
  },
]

export const PROFESSIONAL_TERMS_VERSION = '2026-04-v3'

export const PROFESSIONAL_REQUIRED_TERMS = PROFESSIONAL_TERMS.map(term => term.key)

export function getProfessionalTermTextHash(termKey: ProfessionalTermKey) {
  const term = PROFESSIONAL_TERMS.find(item => item.key === termKey)
  if (!term) return ''
  const payload = JSON.stringify({
    key: term.key,
    title: term.title,
    sections: term.sections,
  })
  return createHash('sha256').update(payload).digest('hex')
}
import { createHash } from 'crypto'
