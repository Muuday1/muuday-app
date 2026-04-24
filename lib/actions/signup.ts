'use server'

import { createClient } from '@/lib/supabase/server'
import { loadSignupCatalogService } from '@/lib/taxonomy/signup-catalog-service'
import type { SignupCatalog } from './signup-types'

export async function loadSignupCatalog(): Promise<SignupCatalog> {
  const supabase = await createClient()
  return loadSignupCatalogService(supabase)
}
