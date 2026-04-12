export type ProfessionalTermKey = 'platform_terms' | 'privacy_terms' | 'regulated_scope_terms'

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
    title: 'Termos para Profissionais da Muuday',
    version: 'v1.0-2026-04',
    shortLabel: 'Termos da plataforma para profissionais',
    sections: [
      {
        heading: '1. Objeto',
        body: 'A Muuday e uma plataforma digital de conexao entre clientes e profissionais. O profissional e responsavel por seu servico, conteudo, conduta e cumprimento das leis aplicaveis.',
      },
      {
        heading: '2. Natureza da plataforma',
        body: 'A Muuday nao atua como clinica, escritorio de advocacia, contador responsavel tecnico ou representante legal. A plataforma facilita descoberta, contato, organizacao e comunicacao.',
      },
      {
        heading: '3. Responsabilidades do profissional',
        body: 'Voce declara que possui habilitacao adequada para sua atividade e que mantera seus dados cadastrais, qualificacoes e documentos corretos, atualizados e verificaveis.',
      },
      {
        heading: '4. Revisao e moderacao',
        body: 'A Muuday pode solicitar ajustes, documentos adicionais, suspender perfil ou encerrar acesso quando houver risco regulatorio, inconsistencias ou violacao destes termos.',
      },
    ],
  },
  {
    key: 'privacy_terms',
    title: 'Politica de Privacidade e Tratamento de Dados',
    version: 'v1.0-2026-04',
    shortLabel: 'Politica de privacidade e dados',
    sections: [
      {
        heading: '1. Dados tratados',
        body: 'A Muuday pode tratar dados cadastrais, profissionais e documentos enviados para analise de conta, seguranca, prevencao de fraude e operacao da plataforma.',
      },
      {
        heading: '2. Base legal e finalidade',
        body: 'Os dados sao tratados para execucao da relacao contratual, cumprimento de obrigacoes legais, seguranca da plataforma e melhoria de processos de revisao.',
      },
      {
        heading: '3. Compartilhamento',
        body: 'Dados podem ser compartilhados com operadores tecnicos essenciais (infraestrutura, armazenamento, seguranca) sob controles de seguranca e necessidade operacional.',
      },
      {
        heading: '4. Retencao e direitos',
        body: 'Os dados sao retidos pelo periodo necessario para obrigacoes legais, auditoria e seguranca. O profissional pode solicitar informacoes e ajustes conforme legislacao aplicavel.',
      },
    ],
  },
  {
    key: 'regulated_scope_terms',
    title: 'Declaracao de Escopo Consultivo e Conformidade Regulatoria',
    version: 'v1.0-2026-04',
    shortLabel: 'Declaracao de escopo consultivo e conformidade',
    sections: [
      {
        heading: '1. Escopo consultivo',
        body: 'Na Muuday, o atendimento inicial e de carater consultivo, informativo ou educacional. Nao deve ser apresentado como substituto de atendimento local regulado quando a lei exigir.',
      },
      {
        heading: '2. Jurisdicao e licenciamento',
        body: 'Voce se compromete a respeitar limites de jurisdicao, licencas, registros profissionais e regras locais do pais onde o cliente se encontra e/ou onde o servico e efetivamente prestado.',
      },
      {
        heading: '3. Servicos regulados',
        body: 'Atos privativos ou regulados (ex.: medico, juridico, contabil e outros) somente podem ocorrer quando legalmente permitidos ao profissional. A Muuday pode bloquear ou sinalizar casos de risco.',
      },
      {
        heading: '4. Declaracao do profissional',
        body: 'Voce declara que nao usara a plataforma para contornar regras regulatorias de outros paises e assume integral responsabilidade por compliance profissional, etico e legal.',
      },
    ],
  },
]

export const PROFESSIONAL_TERMS_VERSION = '2026-04-v1'
