/**
 * Google Document AI adapter for KYC OCR.
 *
 * Requires:
 *   npm install @google-cloud/documentai
 *
 * Environment:
 *   GOOGLE_DOCUMENT_AI_PROJECT_ID   - GCP project ID
 *   GOOGLE_DOCUMENT_AI_LOCATION     - Processor location (default: us)
 *   GOOGLE_DOCUMENT_AI_PROCESSOR_ID - Document AI processor ID
 *   GOOGLE_APPLICATION_CREDENTIALS  - Path to service account JSON (or use ADC)
 */

import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import * as Sentry from '@sentry/nextjs'
import type { OcrExtractedField, OcrResult, OcrProvider } from '../types'

const PROVIDER: OcrProvider = 'document-ai'

interface DocumentAIOptions {
  projectId?: string
  location?: string
  processorId?: string
}

function getDocumentAIClient(_options?: DocumentAIOptions): DocumentProcessorServiceClient {
  return new DocumentProcessorServiceClient()
}

function getProcessorName(options?: DocumentAIOptions): string {
  const projectId = options?.projectId || process.env.GOOGLE_DOCUMENT_AI_PROJECT_ID
  const location = options?.location || process.env.GOOGLE_DOCUMENT_AI_LOCATION || 'us'
  const processorId = options?.processorId || process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID

  if (!projectId || !processorId) {
    throw new Error(
      'Missing Google Document AI configuration. Set GOOGLE_DOCUMENT_AI_PROJECT_ID and GOOGLE_DOCUMENT_AI_PROCESSOR_ID.',
    )
  }

  return `projects/${projectId}/locations/${location}/processors/${processorId}`
}

/**
 * Analyze a document using Google Document AI.
 * The fileUrl is downloaded and sent as base64 to Document AI.
 */
export async function analyzeDocumentWithDocumentAI(
  fileUrl: string,
  options?: DocumentAIOptions,
): Promise<OcrResult> {
  try {
    // Download the file
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)
    const response = await fetch(fileUrl, { signal: controller.signal }).finally(() => clearTimeout(timeoutId))
    if (!response.ok) {
      return {
        provider: PROVIDER,
        status: 'failed',
        score: 0,
        fields: [],
        raw: null,
        error: `Failed to download file: ${response.status} ${response.statusText}`,
      }
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    const mimeType = response.headers.get('content-type') || 'application/pdf'

    const client = getDocumentAIClient(options)
    const processorName = getProcessorName(options)

    const [result] = await client.processDocument({
      name: processorName,
      rawDocument: {
        content: buffer,
        mimeType,
      },
    })

    const document = result.document
    const entities = document?.entities || []
    const fields = mapDocumentAiToFields(entities as unknown as DocumentAiEntity[])

    // Compute average confidence
    const confidences = fields.map(f => f.confidence).filter(c => c > 0)
    const avgConfidence = confidences.length > 0
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : 0

    return {
      provider: PROVIDER,
      status: 'completed',
      score: avgConfidence,
      fields,
      raw: result as unknown as Record<string, unknown>,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    Sentry.captureException(error instanceof Error ? error : new Error(message), { tags: { area: 'kyc', subArea: 'document_ai' } })
    return {
      provider: PROVIDER,
      status: 'failed',
      score: 0,
      fields: [],
      raw: null,
      error: message,
    }
  }
}

type DocumentAiEntity = {
  type?: string
  mentionText?: string
  confidence?: number
  pageAnchor?: {
    pageRefs?: Array<{
      boundingPoly?: {
        normalizedVertices?: Array<{ x?: number; y?: number }>
      }
    }>
  }
}

/**
 * Convert Document AI entities to our canonical format.
 */
export function mapDocumentAiToFields(
  entities: DocumentAiEntity[],
): OcrExtractedField[] {
  return entities.map(entity => ({
    key: normalizeFieldKey(entity.type || ''),
    value: entity.mentionText || '',
    confidence: Math.round((entity.confidence || 0) * 100),
  }))
}

function normalizeFieldKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
}
