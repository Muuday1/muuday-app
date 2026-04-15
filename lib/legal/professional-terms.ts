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
    version: 'v2.0 - 15 abr 2026',
    shortLabel: 'Termos de Uso da Plataforma',
    acceptanceLabel: 'Aceito os Termos de Uso',
    sections: [
      {
        heading: 'Objeto e natureza da plataforma',
        body: 'A Muuday opera como plataforma tecnológica de intermediação entre clientes e profissionais. A Muuday não presta diretamente serviços médicos, jurídicos, contábeis ou equivalentes.',
      },
      {
        heading: 'Conta, elegibilidade e segurança',
        body: 'O profissional declara capacidade legal para contratar, mantém dados verdadeiros e atualizados, e responde pelo uso da conta e pelas credenciais de acesso.',
      },
      {
        heading: 'Responsabilidades do profissional',
        body: 'O profissional é integralmente responsável pelos serviços prestados, conteúdo publicado, conformidade regulatória e cumprimento das leis aplicáveis em sua atuação.',
      },
      {
        heading: 'Moderação, suspensão e encerramento',
        body: 'A Muuday pode solicitar documentos, ajustar visibilidade, suspender ou encerrar conta em caso de inconsistência, risco regulatório, fraude ou violação contratual.',
      },
    ],
  },
  {
    key: 'payment_terms',
    title: 'Termos Financeiros: Plano, Cobrança e Payout',
    version: 'v2.0 - 15 abr 2026',
    shortLabel: 'Termos Financeiros',
    acceptanceLabel: 'Li e autorizo a cobrança recorrente',
    sections: [
      {
        heading: 'Plano e cobrança recorrente',
        body: 'Ao contratar um plano, o profissional autoriza cobrança recorrente no meio de pagamento cadastrado, conforme ciclo e condições comerciais vigentes.',
      },
      {
        heading: 'Falha de pagamento e inadimplência',
        body: 'Falhas de cobrança podem gerar restrição de funcionalidades, suspensão operacional e necessidade de regularização para continuidade do serviço.',
      },
      {
        heading: 'Payout e recebimentos',
        body: 'Recebimentos dependem da configuração financeira, validações obrigatórias e conformidade operacional no provedor de pagamentos.',
      },
      {
        heading: 'Reembolso, disputa e chargeback',
        body: 'A operação financeira considera políticas de cancelamento, reembolso, disputas e chargebacks conforme as regras da plataforma e do intermediador.',
      },
    ],
  },
  {
    key: 'privacy_terms',
    title: 'Política de Privacidade e Proteção de Dados',
    version: 'v2.0 - 15 abr 2026',
    shortLabel: 'Privacidade e Proteção de Dados',
    acceptanceLabel: 'Li e aceito a Política de Privacidade',
    sections: [
      {
        heading: 'Dados tratados e bases legais',
        body: 'A Muuday trata dados cadastrais, profissionais, operacionais e financeiros com base legal adequada para execução contratual, segurança e obrigações regulatórias.',
      },
      {
        heading: 'Compartilhamento e transferências',
        body: 'Dados podem ser compartilhados com operadores essenciais, provedores de infraestrutura e parceiros financeiros com medidas técnicas e contratuais de proteção.',
      },
      {
        heading: 'Retenção e direitos do titular',
        body: 'Dados são mantidos pelo prazo necessário às finalidades legais e operacionais, com garantia de direitos de acesso, correção e demais direitos previstos em lei.',
      },
      {
        heading: 'Segurança e incidentes',
        body: 'A plataforma aplica medidas de segurança para prevenir incidentes e executa procedimentos de resposta e mitigação quando necessário.',
      },
    ],
  },
  {
    key: 'regulated_scope_terms',
    title: 'Declaração de Conformidade Regulatória e Escopo Consultivo',
    version: 'v2.0 - 15 abr 2026',
    shortLabel: 'Conformidade Regulatória',
    acceptanceLabel: 'Declaro estar em conformidade regulatória',
    sections: [
      {
        heading: '1. Escopo consultivo',
        body: 'Na Muuday, o atendimento inicial tem caráter consultivo, informativo ou educacional. Ele não deve ser apresentado como substituto de atendimento local regulado quando a lei exigir.',
      },
      {
        heading: '2. Jurisdição e licenciamento',
        body: 'Você se compromete a respeitar limites de jurisdição, licenças, registros profissionais e regras locais do país onde o cliente se encontra e/ou onde o serviço é efetivamente prestado.',
      },
      {
        heading: '3. Regras por categoria profissional',
        body: 'Categorias reguladas (saúde, jurídico, contábil e outras) devem observar regras específicas dos respectivos conselhos e autoridades locais.',
      },
      {
        heading: '4. Declaração do profissional',
        body: 'Você declara que não usará a plataforma para contornar regras regulatórias de outros países e assume integral responsabilidade por compliance profissional, ético e legal.',
      },
    ],
  },
]

export const PROFESSIONAL_TERMS_VERSION = '2026-04-v3'
