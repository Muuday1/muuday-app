/**
 * KYC OCR Pipeline.
 *
 * Orchestrates document upload → OCR extraction → scoring → triage.
 *
 * Usage:
 *   const result = await runOcrPipeline({
 *     credentialId,
 *     fileUrl,
 *     credentialType,
 *     professionalName,
 *     provider: 'textract', // or 'document-ai'
 *   })
 */

import type { OcrProvider, OcrResult, OcrTriageResult } from './types'
import { triageOcrResult } from './scoring'
import { analyzeDocumentWithTextract } from './providers/textract'
import { analyzeDocumentWithDocumentAI } from './providers/document-ai'

interface RunOcrPipelineArgs {
  fileUrl: string
  credentialType?: string | null
  professionalName?: string | null
  provider?: OcrProvider
}

export async function runOcrPipeline(args: RunOcrPipelineArgs): Promise<{
  ocr: OcrResult
  triage: OcrTriageResult
}> {
  const provider = args.provider || 'textract'

  const ocr = await runOcrProvider(provider, args.fileUrl)

  if (ocr.status === 'failed') {
    const triage = triageOcrResult([], args.credentialType, args.professionalName)
    return { ocr, triage: { ...triage, decision: 'manual_review', reason: `OCR failed: ${ocr.error}` } }
  }

  const triage = triageOcrResult(ocr.fields, args.credentialType, args.professionalName)

  return { ocr, triage }
}

async function runOcrProvider(provider: OcrProvider, fileUrl: string): Promise<OcrResult> {
  switch (provider) {
    case 'textract':
      return analyzeDocumentWithTextract(fileUrl)
    case 'document-ai':
      return analyzeDocumentWithDocumentAI(fileUrl)
    case 'manual':
      return {
        provider: 'manual',
        status: 'completed',
        score: 0,
        fields: [],
        raw: null,
      }
    default:
      return {
        provider,
        status: 'failed',
        score: 0,
        fields: [],
        raw: null,
        error: `Unknown OCR provider: ${provider}`,
      }
  }
}
