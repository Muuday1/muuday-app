import type { SignupCatalog } from '@/lib/actions/signup-types'
import type { ProfessionalTermKey } from '@/lib/legal/professional-terms'

export type Role = 'usuario' | 'profissional'

export type FieldErrors = Record<string, string>
export type ProfessionalTermsAccepted = Record<ProfessionalTermKey, boolean>

export interface QualificationDraft {
  id: string
  name: string
  isCustom: boolean
  suggestionReason: string
  courseName: string
  registrationNumber: string
  issuer: string
  country: string
}

export interface SignupFormProps {
  initialCatalog: SignupCatalog
  redirectPath: string
  requestedRole: string
  origin: string
}
