type QualificationStructured = {
  name?: string | null
  requires_registration?: boolean | null
  course_name?: string | null
  registration_number?: string | null
  issuer?: string | null
  country?: string | null
  evidence_file_names?: string[] | null
}

type CredentialRow = {
  id: string
  credential_type?: string | null
  scan_status?: string | null
  verified?: boolean | null
}

type ApplicationRow = {
  specialty_name?: string | null
  qualifications_structured?: unknown
  taxonomy_suggestions?: unknown
}

export type ReviewFlagSeverity = 'high' | 'medium' | 'low'

export type ProfessionalReviewFlag = {
  code: string
  severity: ReviewFlagSeverity
  message: string
}

function normalize(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function isLikelyRegistrationSpecialty(specialtyName?: string | null) {
  const value = normalize(specialtyName)
  return (
    value.includes('medic') ||
    value.includes('advog') ||
    value.includes('contador') ||
    value.includes('psicolog') ||
    value.includes('fisioter') ||
    value.includes('fonoaudiolog') ||
    value.includes('enferm')
  )
}

function expectedIssuerHint(specialtyName?: string | null) {
  const value = normalize(specialtyName)
  if (value.includes('medic')) return ['crm']
  if (value.includes('advog')) return ['oab']
  if (value.includes('contador')) return ['crc']
  if (value.includes('psicolog')) return ['crp']
  if (value.includes('fisioter')) return ['crefito', 'coffito']
  if (value.includes('fonoaudiolog')) return ['cffa', 'crfa']
  if (value.includes('enferm')) return ['coren', 'cofen']
  if (value.includes('nutric')) return ['crn', 'cfn']
  return []
}

function parseQualifications(raw: unknown): QualificationStructured[] {
  if (!Array.isArray(raw)) return []
  return raw as QualificationStructured[]
}

function hasTermAcceptance(taxonomySuggestions: unknown) {
  if (!taxonomySuggestions || typeof taxonomySuggestions !== 'object') return false
  const root = taxonomySuggestions as Record<string, unknown>
  const terms = root.terms_acceptance
  if (!terms || typeof terms !== 'object') return false
  const t = terms as Record<string, unknown>
  return Boolean(t.platform_terms && t.privacy_terms && t.regulated_scope_terms)
}

export function buildProfessionalCredentialFlags(input: {
  application: ApplicationRow | null
  credentials: CredentialRow[] | null
}) {
  const flags: ProfessionalReviewFlag[] = []
  const credentials = input.credentials || []
  const application = input.application

  const pendingScanCount = credentials.filter(item => item.scan_status === 'pending_scan').length
  const rejectedScanCount = credentials.filter(item => item.scan_status === 'rejected').length
  const cleanScanCount = credentials.filter(item => item.scan_status === 'clean').length

  if (credentials.length === 0) {
    flags.push({
      code: 'NO_CREDENTIAL_FILES',
      severity: 'high',
      message: 'Nenhum documento de credencial foi encontrado para este profissional.',
    })
  }

  if (rejectedScanCount > 0) {
    flags.push({
      code: 'SCAN_REJECTED_FILE',
      severity: 'high',
      message: `${rejectedScanCount} documento(s) com status de scan rejeitado.`,
    })
  }

  if (pendingScanCount > 0) {
    flags.push({
      code: 'SCAN_PENDING',
      severity: 'medium',
      message: `${pendingScanCount} documento(s) ainda aguardando processamento de scan.`,
    })
  }

  if (credentials.length > 0 && cleanScanCount === 0 && rejectedScanCount === 0) {
    flags.push({
      code: 'NO_SCAN_RESULT',
      severity: 'medium',
      message: 'Nao ha documentos com resultado de scan concluido (clean/rejected).',
    })
  }

  const qualifications = parseQualifications(application?.qualifications_structured)
  if (qualifications.length === 0) {
    flags.push({
      code: 'NO_STRUCTURED_QUALIFICATIONS',
      severity: 'medium',
      message: 'Cadastro sem qualificacoes estruturadas no payload do onboarding.',
    })
  }

  const registrationItems = qualifications.filter(item => item.requires_registration)
  for (const item of registrationItems) {
    if (!normalize(item.registration_number) || !normalize(item.issuer) || !normalize(item.country)) {
      flags.push({
        code: 'REGISTRATION_FIELDS_MISSING',
        severity: 'high',
        message: `Qualificacao "${item.name || 'Registro profissional'}" sem numero/orgao/pais completos.`,
      })
    }
  }

  const nonRegistrationItems = qualifications.filter(item => !item.requires_registration)
  for (const item of nonRegistrationItems) {
    if (!normalize(item.course_name)) {
      flags.push({
        code: 'COURSE_NAME_MISSING',
        severity: 'medium',
        message: `Qualificacao "${item.name || 'Certificado'}" sem nome de curso/formacao.`,
      })
    }
  }

  if (isLikelyRegistrationSpecialty(application?.specialty_name) && registrationItems.length === 0) {
    flags.push({
      code: 'SPECIALTY_WITHOUT_REGISTRATION_ITEM',
      severity: 'medium',
      message: 'Especialidade parece regulada, mas nao ha item de registro profissional declarado.',
    })
  }

  const hints = expectedIssuerHint(application?.specialty_name)
  if (hints.length > 0) {
    const issuerTexts = registrationItems.map(item => normalize(item.issuer))
    if (issuerTexts.length > 0) {
      const matched = issuerTexts.some(issuer => hints.some(hint => issuer.includes(hint)))
      if (!matched) {
        flags.push({
          code: 'ISSUER_MISMATCH_HINT',
          severity: 'low',
          message: `Orgao emissor informado nao bate com padrao esperado para a especialidade (${hints.join(', ').toUpperCase()}).`,
        })
      }
    }
  }

  if (!hasTermAcceptance(application?.taxonomy_suggestions)) {
    flags.push({
      code: 'MISSING_TERMS_ACCEPTANCE',
      severity: 'medium',
      message: 'Nao foi encontrado registro estruturado de aceite dos termos profissionais.',
    })
  }

  const severityOrder: Record<ReviewFlagSeverity, number> = { high: 0, medium: 1, low: 2 }
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return {
    flags,
    summary: {
      total: flags.length,
      high: flags.filter(item => item.severity === 'high').length,
      medium: flags.filter(item => item.severity === 'medium').length,
      low: flags.filter(item => item.severity === 'low').length,
    },
  }
}
