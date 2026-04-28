// Client-safe types & constants for review moderation (REVIEW-01)
// No server-only imports — safe to import in Client Components

export const REVIEW_REJECTION_REASONS = [
  { key: 'inappropriate_language', label: 'Linguagem inadequada', canEdit: true },
  { key: 'off_topic', label: 'Fora do contexto / irrelevante', canEdit: true },
  { key: 'conflicts_with_outcome', label: 'Conflita com resultado verificado da sessão', canEdit: true },
  { key: 'suspected_fake', label: 'Suspeita de avaliação falsa', canEdit: false },
  { key: 'personal_information', label: 'Contém informações pessoais', canEdit: true },
  { key: 'custom', label: 'Outro motivo', canEdit: true },
] as const

export type ReviewRejectionReason = (typeof REVIEW_REJECTION_REASONS)[number]['key']

export type ReviewModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export interface ReviewForModeration {
  id: string
  rating: number
  comment: string | null
  moderation_status: ReviewModerationStatus
  is_visible: boolean
  created_at: string
  flag_reasons: string[]
  reviewer: {
    id: string
    full_name: string
    email: string
    created_at: string
    review_count: number
    approved_count: number
    rejected_count: number
  }
  professional: {
    id: string
    full_name: string
    total_reviews: number
    avg_rating: number
  }
  booking: {
    id: string
    status: string
    scheduled_at: string
    duration_minutes: number
  } | null
}
