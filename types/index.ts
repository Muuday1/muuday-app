export type UserRole = 'usuario' | 'profissional' | 'admin'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: UserRole
  country: string
  timezone: string
  currency: string
  avatar_url?: string
  created_at: string
}

export type ProfessionalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended'

export type Professional = {
  id: string
  user_id: string
  status: ProfessionalStatus
  first_booking_enabled?: boolean
  first_booking_gate_note?: string
  first_booking_gate_updated_at?: string
  bio: string
  category: string
  subcategories: string[]
  tags: string[]
  languages: string[]
  years_experience: number
  session_price_brl: number
  session_duration_minutes: number
  rating: number
  total_reviews: number
  total_bookings: number
  profile: Profile
  created_at: string
}

export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'pending_confirmation'
  | 'pending' // legacy compatibility
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'

export type Booking = {
  id: string
  user_id: string
  professional_id: string
  scheduled_at: string
  start_time_utc?: string
  end_time_utc?: string
  timezone_user?: string
  timezone_professional?: string
  duration_minutes: number
  status: BookingStatus
  booking_type?: 'one_off' | 'recurring_parent' | 'recurring_child'
  parent_booking_id?: string | null
  session_link?: string
  price_brl: number
  price_user_currency: number
  price_total?: number
  user_currency: string
  notes?: string
  session_purpose?: string
  professional: Professional
  created_at: string
}

export type Category = {
  id: string
  name: string
  slug: string
  icon: string
  description: string
}

/** @deprecated Use SEARCH_CATEGORIES from lib/search-config.ts or fetch from DB categories table */
export const CATEGORIES: Category[] = [
  { id: '1', name: 'Saúde Mental e Bem-estar Emocional', slug: 'saude-mental-bem-estar', icon: '🧠', description: 'Psicologia, terapia e saúde emocional' },
  { id: '2', name: 'Saúde, Corpo e Movimento', slug: 'saude-corpo-movimento', icon: '💪', description: 'Cuidado físico, nutricional e bem-estar geral' },
  { id: '3', name: 'Educação e Desenvolvimento', slug: 'educacao-desenvolvimento', icon: '📚', description: 'Aulas, reforço, mentoria acadêmica' },
  { id: '4', name: 'Contabilidade, Impostos e Finanças', slug: 'contabilidade-financas', icon: '📊', description: 'Planejamento financeiro e impostos' },
  { id: '5', name: 'Direito e Suporte Jurídico', slug: 'direito-suporte-juridico', icon: '⚖️', description: 'Consultoria jurídica' },
  { id: '6', name: 'Carreira, Negócios e Desenvolvimento Profissional', slug: 'carreira-negocios-desenvolvimento', icon: '🚀', description: 'Evolução de carreira e consultoria' },
  { id: '7', name: 'Tradução e Suporte Documental', slug: 'traducao-suporte-documental', icon: '🌐', description: 'Tradução, revisão e documentação' },
  { id: '8', name: 'Outro', slug: 'outro', icon: '🧩', description: 'Outros serviços especializados' },
]
