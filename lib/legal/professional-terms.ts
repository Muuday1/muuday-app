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
  sections: Array<{ heading: string; body: string }>
}

export const PROFESSIONAL_TERMS: ProfessionalTerm[] = [
  {
    key: 'platform_terms',
    title: 'Termos da plataforma para profissionais da Muuday',
    version: 'v1.1-2026-04',
    shortLabel: 'Termos da plataforma',
    sections: [
      {
        heading: '1. Objeto',
        body: 'A Muuday é uma plataforma digital de conexão entre clientes e profissionais. O profissional é responsável pelo seu serviço, conteúdo, conduta e cumprimento das leis aplicáveis.',
      },
      {
        heading: '2. Natureza da plataforma',
        body: 'A Muuday não atua como clínica, escritório de advocacia, contador responsável técnico ou representante legal. A plataforma facilita descoberta, contato, organização e comunicação.',
      },
      {
        heading: '3. Responsabilidades do profissional',
        body: 'Você declara que possui habilitação adequada para sua atividade e que manterá seus dados cadastrais, qualificações e documentos corretos, atualizados e verificáveis.',
      },
      {
        heading: '4. Revisão e moderação',
        body: 'A Muuday pode solicitar ajustes, documentos adicionais, suspender perfil ou encerrar acesso quando houver risco regulatório, inconsistências ou violação destes termos.',
      },
    ],
  },
  {
    key: 'payment_terms',
    title: 'Termos de cobrança, plano e pagamentos',
    version: 'v1.1-2026-04',
    shortLabel: 'Termos de cobrança e pagamentos',
    sections: [
      {
        heading: '1. Plano e recorrência',
        body: 'O profissional concorda com a cobrança recorrente do plano escolhido, conforme o ciclo contratado, até cancelamento conforme as regras da plataforma.',
      },
      {
        heading: '2. Cartão e meios de pagamento',
        body: 'O profissional é responsável por manter um cartão ou meio de pagamento válido para a cobrança do plano. Falhas de pagamento podem limitar recursos ou bloquear publicação.',
      },
      {
        heading: '3. Recebimentos',
        body: 'Recebimentos ao profissional dependem da configuração correta da conta financeira, cumprimento de validações e eventuais revisões operacionais e antifraude.',
      },
      {
        heading: '4. Cancelamento e ajustes',
        body: 'Alterações de plano, upgrades, downgrades, reembolsos e ajustes operacionais seguem as regras comerciais e operacionais vigentes na Muuday.',
      },
    ],
  },
  {
    key: 'privacy_terms',
    title: 'Termos de segurança, privacidade e proteção de dados',
    version: 'v1.1-2026-04',
    shortLabel: 'Segurança e proteção de dados',
    sections: [
      {
        heading: '1. Dados tratados',
        body: 'A Muuday pode tratar dados cadastrais, profissionais e documentos enviados para análise de conta, segurança, prevenção de fraude e operação da plataforma.',
      },
      {
        heading: '2. Base legal e finalidade',
        body: 'Os dados são tratados para execução da relação contratual, cumprimento de obrigações legais, segurança da plataforma e melhoria de processos de revisão.',
      },
      {
        heading: '3. Compartilhamento',
        body: 'Dados podem ser compartilhados com operadores técnicos essenciais, como infraestrutura, armazenamento e segurança, sob controles compatíveis com a operação da plataforma.',
      },
      {
        heading: '4. Retenção e direitos',
        body: 'Os dados são retidos pelo período necessário para obrigações legais, auditoria e segurança. O profissional pode solicitar informações e ajustes conforme a legislação aplicável.',
      },
    ],
  },
  {
    key: 'regulated_scope_terms',
    title: 'Declaração de escopo consultivo e conformidade regulatória',
    version: 'v1.1-2026-04',
    shortLabel: 'Escopo consultivo e conformidade',
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
        heading: '3. Serviços regulados',
        body: 'Atos privativos ou regulados, como médico, jurídico, contábil e outros, somente podem ocorrer quando legalmente permitidos ao profissional. A Muuday pode bloquear ou sinalizar casos de risco.',
      },
      {
        heading: '4. Declaração do profissional',
        body: 'Você declara que não usará a plataforma para contornar regras regulatórias de outros países e assume integral responsabilidade por compliance profissional, ético e legal.',
      },
    ],
  },
]

export const PROFESSIONAL_TERMS_VERSION = '2026-04-v2'
