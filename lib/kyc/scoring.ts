/**
 * KYC OCR scoring engine.
 *
 * Thresholds:
 *   > 80  → auto_approve
 *   50-80 → manual_review
 *   < 50  → reject
 */

import type { OcrDecision, OcrExtractedField, OcrTriageResult } from './types'

const AUTO_APPROVE_THRESHOLD = 80
const MANUAL_REVIEW_THRESHOLD = 50

interface ScoreWeights {
  nameMatch: number
  credentialTypeMatch: number
  dateValidity: number
  issuerRecognized: number
  documentCompleteness: number
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  nameMatch: 25,
  credentialTypeMatch: 20,
  dateValidity: 20,
  issuerRecognized: 15,
  documentCompleteness: 20,
}

export function computeOcrScore(
  fields: OcrExtractedField[],
  expectedCredentialType?: string | null,
  professionalName?: string | null,
): number {
  let score = 0

  // 1. Name match (if we have professional name to compare)
  if (professionalName) {
    const nameField = fields.find(f =>
      ['name', 'full_name', 'nome', 'nome_completo'].includes(f.key.toLowerCase()),
    )
    if (nameField && fuzzyNameMatch(nameField.value, professionalName)) {
      score += DEFAULT_WEIGHTS.nameMatch
    }
  } else {
    // If no name to compare, award partial credit for having a name field
    const hasNameField = fields.some(f =>
      ['name', 'full_name', 'nome', 'nome_completo'].includes(f.key.toLowerCase()),
    )
    if (hasNameField) score += DEFAULT_WEIGHTS.nameMatch * 0.5
  }

  // 2. Credential type match
  if (expectedCredentialType) {
    const typeField = fields.find(f =>
      ['type', 'credential_type', 'tipo', 'tipo_credencial'].includes(f.key.toLowerCase()),
    )
    if (typeField && typeField.value.toLowerCase().includes(expectedCredentialType.toLowerCase())) {
      score += DEFAULT_WEIGHTS.credentialTypeMatch
    }
  } else {
    score += DEFAULT_WEIGHTS.credentialTypeMatch * 0.5
  }

  // 3. Date validity (issue date or expiration date present)
  const hasDate = fields.some(f =>
    ['date', 'issue_date', 'expiration_date', 'data', 'data_emissao', 'data_validade'].includes(
      f.key.toLowerCase(),
    ),
  )
  if (hasDate) score += DEFAULT_WEIGHTS.dateValidity

  // 4. Issuer recognized (university, institution, etc.)
  const hasIssuer = fields.some(f =>
    ['issuer', 'institution', 'university', 'orgao', 'instituicao', 'universidade'].includes(
      f.key.toLowerCase(),
    ),
  )
  if (hasIssuer) score += DEFAULT_WEIGHTS.issuerRecognized

  // 5. Document completeness (number of fields extracted)
  const fieldCount = fields.length
  if (fieldCount >= 5) score += DEFAULT_WEIGHTS.documentCompleteness
  else if (fieldCount >= 3) score += DEFAULT_WEIGHTS.documentCompleteness * 0.6
  else if (fieldCount >= 1) score += DEFAULT_WEIGHTS.documentCompleteness * 0.3

  return Math.min(100, Math.max(0, score))
}

export function triageOcrResult(
  fields: OcrExtractedField[],
  expectedCredentialType?: string | null,
  professionalName?: string | null,
): OcrTriageResult {
  const score = computeOcrScore(fields, expectedCredentialType, professionalName)

  let decision: OcrDecision
  let reason: string

  if (score >= AUTO_APPROVE_THRESHOLD) {
    decision = 'auto_approve'
    reason = `High confidence score (${score}). All critical fields detected.`
  } else if (score >= MANUAL_REVIEW_THRESHOLD) {
    decision = 'manual_review'
    reason = `Medium confidence score (${score}). Requires human verification.`
  } else {
    decision = 'reject'
    reason = `Low confidence score (${score}). Insufficient document quality or missing fields.`
  }

  return { decision, score, reason, extractedFields: fields }
}

function fuzzyNameMatch(ocrName: string, profileName: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()

  const ocr = normalize(ocrName)
  const profile = normalize(profileName)

  if (!ocr || !profile) return false
  if (ocr === profile) return true

  // Check if one contains the other (first name match is often enough)
  const ocrParts = ocr.split(/\s+/)
  const profileParts = profile.split(/\s+/)

  const commonParts = ocrParts.filter(p => profileParts.includes(p))
  return commonParts.length >= Math.min(2, Math.min(ocrParts.length, profileParts.length))
}
