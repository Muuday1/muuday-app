'use server'

import { createClient } from '@/lib/supabase/server'
import {
  updateTaxonomyItemService,
  insertTaxonomyItemService,
  toggleTaxonomyActiveService,
  loadTaxonomyDataService,
  reviewTagSuggestionService,
} from '@/lib/admin/taxonomy-service'
import type { TaxonomyType, TaxonomyItemUpdate, TaxonomyItemInsert, TaxonomyData } from './admin-taxonomy-types'

export async function updateTaxonomyItem(
  type: TaxonomyType,
  id: string,
  data: TaxonomyItemUpdate,
) {
  const supabase = await createClient()
  return updateTaxonomyItemService(supabase, type, id, data)
}

export async function insertTaxonomyItem(data: TaxonomyItemInsert) {
  const supabase = await createClient()
  return insertTaxonomyItemService(supabase, data)
}

export async function toggleTaxonomyActive(
  type: TaxonomyType,
  id: string,
  currentActive: boolean,
) {
  const supabase = await createClient()
  return toggleTaxonomyActiveService(supabase, type, id, currentActive)
}

export async function loadTaxonomyData() {
  const supabase = await createClient()
  return loadTaxonomyDataService(supabase)
}

export async function reviewTagSuggestion(
  id: string,
  status: 'approved' | 'rejected',
) {
  const supabase = await createClient()
  return reviewTagSuggestionService(supabase, id, status)
}
