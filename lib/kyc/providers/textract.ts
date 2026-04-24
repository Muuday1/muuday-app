/**
 * AWS Textract adapter for KYC OCR.
 *
 * Requires:
 *   npm install @aws-sdk/client-textract
 *
 * Environment:
 *   AWS_REGION          - AWS region (default: us-east-1)
 *   AWS_ACCESS_KEY_ID   - IAM access key
 *   AWS_SECRET_ACCESS_KEY - IAM secret key
 */

import { TextractClient, AnalyzeDocumentCommand, FeatureType } from '@aws-sdk/client-textract'
import type { OcrExtractedField, OcrResult, OcrProvider } from '../types'

const PROVIDER: OcrProvider = 'textract'

interface TextractOptions {
  region?: string
}

function getTextractClient(options?: TextractOptions): TextractClient {
  const region = options?.region || process.env.AWS_REGION || 'us-east-1'
  return new TextractClient({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  })
}

/**
 * Analyze a document using AWS Textract.
 * The fileUrl is downloaded and sent as bytes to Textract.
 */
export async function analyzeDocumentWithTextract(
  fileUrl: string,
  options?: TextractOptions,
): Promise<OcrResult> {
  try {
    // Download the file
    const response = await fetch(fileUrl)
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

    const client = getTextractClient(options)
    const command = new AnalyzeDocumentCommand({
      Document: { Bytes: buffer },
      FeatureTypes: [FeatureType.FORMS],
    })

    const result = await client.send(command)
    const blocks = result.Blocks || []
    const fields = mapTextractToFields(blocks)

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
    console.error('[kyc/textract] Error:', message)
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

/**
 * Convert Textract key-value pairs to our canonical format.
 */
export function mapTextractToFields(blocks: unknown[]): OcrExtractedField[] {
  type Block = {
    BlockType?: string
    EntityTypes?: string[]
    Relationships?: Array<{ Type?: string; Ids?: string[] }>
    Text?: string
    Confidence?: number
    Id?: string
  }

  const typedBlocks = blocks as Block[]
  const blockMap = new Map<string, Block>()
  for (const block of typedBlocks) {
    if (block.Id) blockMap.set(block.Id, block)
  }

  function getTextForBlock(block: Block): string {
    if (block.Text) return block.Text
    const childIds = block.Relationships?.find(r => r.Type === 'CHILD')?.Ids || []
    return childIds.map(id => blockMap.get(id)?.Text).filter(Boolean).join(' ')
  }

  function findValueBlock(keyBlock: Block): Block | undefined {
    const valueRel = keyBlock.Relationships?.find(r => r.Type === 'VALUE')
    const valueId = valueRel?.Ids?.[0]
    if (!valueId) return undefined
    const valueBlock = blockMap.get(valueId)
    // The value block itself may have child words
    return valueBlock
  }

  const keyValueBlocks = typedBlocks.filter(
    b => b.BlockType === 'KEY_VALUE_SET' && b.EntityTypes?.includes('KEY'),
  )

  return keyValueBlocks.map(keyBlock => {
    const keyText = getTextForBlock(keyBlock)
    const valueBlock = findValueBlock(keyBlock)
    const valueText = valueBlock ? getTextForBlock(valueBlock) : ''

    return {
      key: normalizeFieldKey(keyText),
      value: valueText,
      confidence: Math.round(keyBlock.Confidence || 0),
    }
  })
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
