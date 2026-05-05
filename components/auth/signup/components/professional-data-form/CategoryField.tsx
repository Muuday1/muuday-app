'use client'

import { inputClass } from '../../helpers'
import type { FieldErrors } from '../../types'

interface CategoryFieldProps {
  professionalCategory: string
  professionalCategoryOptions: Array<{ slug: string; name: string; icon: string }>
  selectedSubcategory: { slug: string; name: string; categorySlug: string; categoryName: string } | null
  fieldErrors: FieldErrors
}

export function CategoryField({
  professionalCategory,
  professionalCategoryOptions,
  selectedSubcategory,
  fieldErrors,
}: CategoryFieldProps) {
  return (
    <div>
      <label htmlFor="professional-category" className="mb-1.5 block text-sm font-medium text-slate-700">
        Categoria principal
      </label>
      <input
        id="professional-category"
        type="text"
        value={
          professionalCategoryOptions.find(item => item.slug === professionalCategory)?.name ||
          selectedSubcategory?.categoryName ||
          ''
        }
        readOnly
        placeholder="Selecionada automaticamente pela área"
        className={inputClass(Boolean(fieldErrors.professionalCategory))}
        aria-invalid={Boolean(fieldErrors.professionalCategory)}
      />
      {fieldErrors.professionalCategory && <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalCategory}</p>}
    </div>
  )
}
