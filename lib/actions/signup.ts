'use server'

import { createClient } from '@/lib/supabase/server'
import {
  loadActiveTaxonomyCatalog,
  buildSpecialtyOptionsByCategorySlug,
  buildSubcategoryOptionsByCategorySlug,
  buildSpecialtyOptionsBySubcategorySlug,
  type TaxonomyCatalog,
} from '@/lib/taxonomy/professional-specialties'

export interface SignupCatalog {
  categories: Array<{ slug: string; name: string; icon: string }>
  specialtyOptionsByCategory: Record<string, string[]>
  subcategoryOptionsByCategory: Record<string, Array<{ slug: string; name: string }>>
  specialtyOptionsBySubcategory: Record<string, string[]>
  subcategoryDirectory: Array<{ slug: string; name: string; categorySlug: string; categoryName: string }>
}

export async function loadSignupCatalog(): Promise<SignupCatalog> {
  const supabase = createClient()
  const catalog = await loadActiveTaxonomyCatalog(supabase)

  if (!catalog) {
    return {
      categories: [],
      specialtyOptionsByCategory: {},
      subcategoryOptionsByCategory: {},
      specialtyOptionsBySubcategory: {},
      subcategoryDirectory: [],
    }
  }

  const specialtyMap = buildSpecialtyOptionsByCategorySlug(catalog)
  const subcategoryMap = buildSubcategoryOptionsByCategorySlug(catalog)
  const specialtyBySubcategoryMap = buildSpecialtyOptionsBySubcategorySlug(catalog)

  const categories = catalog.categories.map(category => ({
    slug: category.slug,
    name: category.name_pt || category.slug,
    icon: '🧩',
  }))

  const subcategoryDirectory = catalog.subcategories
    .map(subcategory => {
      const category = catalog.categories.find(item => item.id === subcategory.category_id)
      if (!category) return null
      return {
        slug: subcategory.slug,
        name: subcategory.name_pt,
        categorySlug: category.slug,
        categoryName: category.name_pt,
      }
    })
    .filter((item): item is { slug: string; name: string; categorySlug: string; categoryName: string } =>
      Boolean(item),
    )

  return {
    categories,
    specialtyOptionsByCategory: Object.fromEntries(specialtyMap.entries()),
    subcategoryOptionsByCategory: Object.fromEntries(subcategoryMap.entries()),
    specialtyOptionsBySubcategory: Object.fromEntries(specialtyBySubcategoryMap.entries()),
    subcategoryDirectory,
  }
}
