/**
 * KYC OCR domain types.
 */

export type OcrProvider = 'textract' | 'document-ai' | 'manual'

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'manual_review'

export type OcrDecision = 'auto_approve' | 'manual_review' | 'reject'

export interface OcrExtractedField {
  key: string
  value: string
  confidence: number // 0-100
}

export interface OcrResult {
  provider: OcrProvider
  status: OcrStatus
  score: number // 0-100
  fields: OcrExtractedField[]
  raw: Record<string, unknown> | null
  error?: string
}

export interface OcrTriageResult {
  decision: OcrDecision
  score: number
  reason: string
  extractedFields: OcrExtractedField[]
}

export interface CredentialOcrRow {
  id: string
  professional_id: string
  file_url: string
  credential_type: string | null
  ocr_status: OcrStatus
  ocr_score: number | null
  ocr_extracted_data: Record<string, unknown> | null
  ocr_provider: OcrProvider | null
  ocr_checked_at: string | null
  ocr_review_notes: string | null
}
