import type { SupabaseClient } from '@supabase/supabase-js'

export type TaxonomyType = 'category' | 'subcategory' | 'specialty' | 'service_option'

function getTableName(type: TaxonomyType): string {
  switch (type) {
    case 'category':
      return 'categories'
    case 'subcategory':
      return 'subcategories'
    case 'specialty':
      return 'specialties'
    case 'service_option':
      return 'taxonomy_service_options'
  }
}

export interface TaxonomyItemUpdate {
  name_pt: string
  name_en: string
  slug: string
}

export async function updateTaxonomyItemService(
  supabase: SupabaseClient,
  type: TaxonomyType,
  id: string,
  data: TaxonomyItemUpdate,
) {
  const { error } = await supabase
    .from(getTableName(type))
    .update({
      name_pt: data.name_pt.trim(),
      name_en: data.name_en.trim(),
      slug: data.slug,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface TaxonomyItemInsert {
  type: TaxonomyType
  parentId: string
  slug: string
  name_pt: string
  name_en: string
  sortOrder: number
}

export async function insertTaxonomyItemService(
  supabase: SupabaseClient,
  data: TaxonomyItemInsert,
) {
  const table = getTableName(data.type)
  const payload: Record<string, string | number> = {
    slug:
      data.slug ||
      data.name_pt
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    name_pt: data.name_pt.trim(),
    name_en: data.name_en.trim() || data.name_pt.trim(),
    sort_order: data.sortOrder,
  }

  if (data.type === 'subcategory') {
    payload.category_id = data.parentId
  } else if (data.type === 'specialty') {
    payload.subcategory_id = data.parentId
  } else if (data.type === 'service_option') {
    payload.subcategory_slug = data.parentId
  }

  const { error } = await supabase.from(table).insert(payload)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function toggleTaxonomyActiveService(
  supabase: SupabaseClient,
  type: TaxonomyType,
  id: string,
  currentActive: boolean,
) {
  const { error } = await supabase
    .from(getTableName(type))
    .update({ is_active: !currentActive })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface TaxonomyData {
  categories: { id: string; slug: string; name_pt: string; name_en: string; icon: string; sort_order: number; is_active: boolean }[]
  subcategories: { id: string; category_id: string; slug: string; name_pt: string; name_en: string; sort_order: number; is_active: boolean }[]
  specialties: { id: string; subcategory_id: string; slug: string; name_pt: string; name_en: string; sort_order: number; is_active: boolean }[]
  serviceOptions: { id: string; subcategory_slug: string; slug: string; name_pt: string; name_en: string; sort_order: number; is_active: boolean }[]
  tagSuggestions: { id: string; professional_id: string; tag: string; status: string; created_at: string }[]
}

export async function loadTaxonomyDataService(supabase: SupabaseClient) {
  const [cRes, scRes, spRes, soRes, tsRes] = await Promise.all([
    supabase.from('categories').select('id,slug,name_pt,name_en,icon,sort_order,is_active').order('sort_order'),
    supabase.from('subcategories').select('id,category_id,slug,name_pt,name_en,sort_order,is_active').order('sort_order'),
    supabase.from('specialties').select('id,subcategory_id,slug,name_pt,name_en,sort_order,is_active').order('sort_order'),
    supabase.from('taxonomy_service_options').select('id,subcategory_slug,slug,name_pt,name_en,sort_order,is_active').order('subcategory_slug').order('sort_order'),
    supabase.from('tag_suggestions').select('id,professional_id,tag,status,created_at').eq('status', 'pending').order('created_at', { ascending: false }),
  ])

  if (cRes.error || scRes.error || spRes.error || soRes.error || tsRes.error) {
    return { success: false, error: 'Erro ao carregar dados da taxonomia.' }
  }

  return {
    success: true,
    data: {
      categories: cRes.data || [],
      subcategories: scRes.data || [],
      specialties: spRes.data || [],
      serviceOptions: soRes.data || [],
      tagSuggestions: tsRes.data || [],
    },
  }
}

export async function reviewTagSuggestionService(
  supabase: SupabaseClient,
  id: string,
  status: 'approved' | 'rejected',
) {
  const { error } = await supabase
    .from('tag_suggestions')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
