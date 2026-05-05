'use client'

import { inputClass } from '../../helpers'
import type { FieldErrors } from '../../types'

interface ExperienceFieldProps {
  professionalYearsExperience: string
  fieldErrors: FieldErrors
  onYearsExperienceChange: (value: string) => void
}

export function ExperienceField({
  professionalYearsExperience,
  fieldErrors,
  onYearsExperienceChange,
}: ExperienceFieldProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="professional-years" className="mb-1.5 block text-sm font-medium text-slate-700">
          Anos de experiência
        </label>
        <input
          id="professional-years"
          type="number"
          min={0}
          max={60}
          value={professionalYearsExperience}
          onChange={event => onYearsExperienceChange(event.target.value)}
          required
          className={inputClass(Boolean(fieldErrors.professionalYearsExperience))}
          aria-invalid={Boolean(fieldErrors.professionalYearsExperience)}
        />
        {fieldErrors.professionalYearsExperience && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.professionalYearsExperience}</p>
        )}
      </div>
    </div>
  )
}
