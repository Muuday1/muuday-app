import type { SupabaseClient } from '@supabase/supabase-js'
import { getOrSetUpstashJsonCache } from '@/lib/cache/upstash-json-cache'

type CategoryRow = {
  id: string
  slug: string
  name_pt: string
  is_active: boolean
  sort_order: number
}


type SubcategoryRow = {
  id: string
  category_id: string
  slug: string
  name_pt: string
  is_active: boolean
  sort_order: number
}

type SpecialtyRow = {
  id: string
  subcategory_id: string
  name_pt: string
  is_active: boolean
  sort_order: number
}

type ProfessionalSpecialtyRow = {
  professional_id: string
  specialty_id: string
}

export type TaxonomyCatalog = {
  categories: CategoryRow[]
  subcategories: SubcategoryRow[]
  specialties: SpecialtyRow[]
}

export type ProfessionalSpecialtyContext = {
  byProfessionalId: Map<string, string[]>
  primaryByProfessionalId: Map<string, string>
  categorySlugsByProfessionalId: Map<string, string[]>
}

const EMPTY_CONTEXT: ProfessionalSpecialtyContext = {
  byProfessionalId: new Map(),
  primaryByProfessionalId: new Map(),
  categorySlugsByProfessionalId: new Map(),
}

const TAXONOMY_ACTIVE_CATALOG_CACHE_KEY = 'taxonomy:active-catalog:v1'
const TAXONOMY_ACTIVE_CATALOG_TTL_SECONDS = 60 * 60

function normalizeName(value?: string | null) {
  return String(value || '').trim()
}

export async function loadActiveTaxonomyCatalog(
  supabase: SupabaseClient,
): Promise<TaxonomyCatalog | null> {
  return getOrSetUpstashJsonCache<TaxonomyCatalog | null>({
    key: TAXONOMY_ACTIVE_CATALOG_CACHE_KEY,
    ttlSeconds: TAXONOMY_ACTIVE_CATALOG_TTL_SECONDS,
    version: 'v1',
    loader: async () => {
      const [categoriesRes, subcategoriesRes, specialtiesRes] = await Promise.all([
        supabase
          .from('categories')
          .select('id,slug,name_pt,is_active,sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('subcategories')
          .select('id,category_id,slug,name_pt,is_active,sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('specialties')
          .select('id,subcategory_id,name_pt,is_active,sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ])

      if (categoriesRes.error || subcategoriesRes.error || specialtiesRes.error) {
        return null
      }

      return {
        categories: (categoriesRes.data as CategoryRow[]) || [],
        subcategories: (subcategoriesRes.data as SubcategoryRow[]) || [],
        specialties: (specialtiesRes.data as SpecialtyRow[]) || [],
      }
    },
  })
}

export function buildSpecialtyOptionsByCategorySlug(catalog: TaxonomyCatalog) {
  const categoryById = new Map(catalog.categories.map(category => [category.id, category]))
  const subcategoryById = new Map(catalog.subcategories.map(subcategory => [subcategory.id, subcategory]))

  const map = new Map<string, string[]>()

  for (const specialty of catalog.specialties) {
    const subcategory = subcategoryById.get(specialty.subcategory_id)
    if (!subcategory) continue
    const category = categoryById.get(subcategory.category_id)
    if (!category) continue

    const key = category.slug
    const current = map.get(key) || []
    current.push(specialty.name_pt)
    map.set(key, current)
  }

  map.forEach((values, key) => {
    const normalized = Array.from(
      new Set(values.map(value => normalizeName(value)).filter((value): value is string => Boolean(value))),
    )
    normalized.sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    map.set(key, normalized)
  })

  return map
}

export async function loadProfessionalSpecialtyContext(
  supabase: SupabaseClient,
  professionalIds: string[],
): Promise<ProfessionalSpecialtyContext> {
  const validIds = Array.from(new Set(professionalIds.map(id => normalizeName(id)).filter(Boolean)))
  if (validIds.length === 0) return EMPTY_CONTEXT

  const professionalSpecialtiesRes = await supabase
    .from('professional_specialties')
    .select('professional_id,specialty_id')
    .in('professional_id', validIds)

  if (professionalSpecialtiesRes.error || !professionalSpecialtiesRes.data?.length) {
    return EMPTY_CONTEXT
  }

  const links = professionalSpecialtiesRes.data as ProfessionalSpecialtyRow[]
  const specialtyIds = Array.from(new Set(links.map(link => link.specialty_id).filter(Boolean)))

  const specialtiesRes = await supabase
    .from('specialties')
    .select('id,subcategory_id,name_pt,is_active,sort_order')
    .in('id', specialtyIds)

  if (specialtiesRes.error || !specialtiesRes.data?.length) {
    return EMPTY_CONTEXT
  }

  const specialties = specialtiesRes.data as SpecialtyRow[]
  const subcategoryIds = Array.from(new Set(specialties.map(specialty => specialty.subcategory_id).filter(Boolean)))

  const subcategoriesRes = await supabase
    .from('subcategories')
    .select('id,category_id,slug,name_pt,is_active,sort_order')
    .in('id', subcategoryIds)

  if (subcategoriesRes.error || !subcategoriesRes.data?.length) {
    return EMPTY_CONTEXT
  }

  const subcategories = subcategoriesRes.data as SubcategoryRow[]
  const categoryIds = Array.from(new Set(subcategories.map(subcategory => subcategory.category_id).filter(Boolean)))

  const categoriesRes = await supabase
    .from('categories')
    .select('id,slug,name_pt,is_active,sort_order')
    .in('id', categoryIds)

  if (categoriesRes.error || !categoriesRes.data?.length) {
    return EMPTY_CONTEXT
  }

  const categories = categoriesRes.data as CategoryRow[]
  const specialtyById = new Map(specialties.map(specialty => [specialty.id, specialty]))
  const subcategoryById = new Map(subcategories.map(subcategory => [subcategory.id, subcategory]))
  const categoryById = new Map(categories.map(category => [category.id, category]))

  const grouped = new Map<string, Array<{ specialty: SpecialtyRow; subcategory: SubcategoryRow; category: CategoryRow }>>()

  for (const link of links) {
    const specialty = specialtyById.get(link.specialty_id)
    if (!specialty || !specialty.is_active) continue

    const subcategory = subcategoryById.get(specialty.subcategory_id)
    if (!subcategory || !subcategory.is_active) continue

    const category = categoryById.get(subcategory.category_id)
    if (!category || !category.is_active) continue

    const current = grouped.get(link.professional_id) || []
    current.push({ specialty, subcategory, category })
    grouped.set(link.professional_id, current)
  }

  const byProfessionalId = new Map<string, string[]>()
  const primaryByProfessionalId = new Map<string, string>()
  const categorySlugsByProfessionalId = new Map<string, string[]>()

  grouped.forEach((entries, professionalId) => {
    entries.sort((a, b) => {
      if (a.category.sort_order !== b.category.sort_order) {
        return a.category.sort_order - b.category.sort_order
      }
      if (a.subcategory.sort_order !== b.subcategory.sort_order) {
        return a.subcategory.sort_order - b.subcategory.sort_order
      }
      if (a.specialty.sort_order !== b.specialty.sort_order) {
        return a.specialty.sort_order - b.specialty.sort_order
      }
      return a.specialty.name_pt.localeCompare(b.specialty.name_pt, 'pt-BR', { sensitivity: 'base' })
    })

    const specialtyNames = Array.from(
      new Set(
        entries
          .map(entry => normalizeName(entry.specialty.name_pt))
          .filter((value): value is string => Boolean(value)),
      ),
    )

    if (specialtyNames.length > 0) {
      byProfessionalId.set(professionalId, specialtyNames)
      primaryByProfessionalId.set(professionalId, specialtyNames[0])
    }

    const categorySlugs = Array.from(
      new Set(entries.map(entry => entry.category.slug).filter((value): value is string => Boolean(value))),
    )
    if (categorySlugs.length > 0) {
      categorySlugsByProfessionalId.set(professionalId, categorySlugs)
    }
  })

  return {
    byProfessionalId,
    primaryByProfessionalId,
    categorySlugsByProfessionalId,
  }
}
