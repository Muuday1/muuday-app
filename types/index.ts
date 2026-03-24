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

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export type Booking = {
  id: string
  user_id: string
  professional_id: string
  scheduled_at: string
  duration_minutes: number
  status: BookingStatus
  session_link?: string
  price_brl: number
  price_user_currency: number
  user_currency: string
  notes?: string
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

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Psicologia', slug: 'psicologia', icon: '🧠', description: 'Terapia e saúde mental' },
  { id: '2', name: 'Direito', slug: 'direito', icon: '⚖️', description: 'Consultoria jurídica' },
  { id: '3', name: 'Contabilidade', slug: 'contabilidade', icon: '📊', description: 'Finanças e impostos' },
  { id: '4', name: 'Nutrição', slug: 'nutricao', icon: '🥗', description: 'Saúde e alimentação' },
  { id: '5', name: 'Fisioterapia', slug: 'fisioterapia', icon: '💪', description: 'Reabilitação física' },
  { id: '6', name: 'Educação', slug: 'educacao', icon: '📚', description: 'Aulas e tutoria' },
  { id: '7', name: 'Coaching', slug: 'coaching', icon: '🎯', description: 'Desenvolvimento pessoal' },
  { id: '8', name: 'Medicina', slug: 'medicina', icon: '🏥', description: 'Consultas médicas' },
]
