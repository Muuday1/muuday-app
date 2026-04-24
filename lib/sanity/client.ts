import { createClient } from '@sanity/client'
import { env } from '@/lib/config/env'

/**
 * Sanity CMS client for content fetching.
 * Used for guides, blog posts, landing blocks, and legal documents.
 *
 * Configuration:
 *   SANITY_PROJECT_ID  - Sanity project ID
 *   SANITY_DATASET     - Dataset name (default: 'production')
 *   SANITY_API_KEY     - API token with read access
 *
 * For write operations (preview mode, webhooks), use sanityWriteClient.
 */
export const sanityClient = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2026-04-23',
  useCdn: process.env.NODE_ENV === 'production',
  token: env.SANITY_API_KEY,
})

/**
 * Sanity client with CDN disabled for draft/preview content.
 * Use this for preview mode or when fetching drafts.
 */
export const sanityPreviewClient = createClient({
  projectId: env.SANITY_PROJECT_ID,
  dataset: env.SANITY_DATASET,
  apiVersion: '2026-04-23',
  useCdn: false,
  token: env.SANITY_API_KEY,
})

export function isSanityConfigured(): boolean {
  return Boolean(env.SANITY_PROJECT_ID && env.SANITY_API_KEY)
}
