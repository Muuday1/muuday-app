import { supabase } from './supabase'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''
const MOBILE_API_KEY = process.env.EXPO_PUBLIC_MOBILE_API_KEY ?? ''

if (!API_BASE_URL) {
  console.error('[API] Missing EXPO_PUBLIC_API_BASE_URL environment variable')
}

export type ApiError = {
  status: number
  message: string
  code?: string
}

export class ApiClientError extends Error {
  status: number
  code?: string

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiClientError'
    this.status = error.status
    this.code = error.code
  }
}

async function request<T>(
  method: string,
  path: string,
  options?: {
    body?: unknown
    query?: Record<string, string | number | boolean | undefined>
    headers?: Record<string, string>
  }
): Promise<T> {
  const url = new URL(path.replace(/^\//, ''), API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`)

  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options?.headers,
  }

  // Add auth token
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // Add session JSON for server-side Supabase client reconstruction
  if (sessionData.session) {
    headers['X-Supabase-Session'] = JSON.stringify(sessionData.session)
  }

  // Add mobile API key
  if (MOBILE_API_KEY) {
    headers['X-Mobile-API-Key'] = MOBILE_API_KEY
  }

  const init: RequestInit = {
    method,
    headers,
  }

  if (options?.body !== undefined) {
    init.body = JSON.stringify(options.body)
  }

  const response = await fetch(url.toString(), init)

  if (response.status === 204) {
    return undefined as T
  }

  let data: unknown
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    data = await response.json()
  } else {
    data = { error: await response.text() }
  }

  if (!response.ok) {
    const errorBody = data as { error?: string; code?: string; message?: string }
    throw new ApiClientError({
      status: response.status,
      message: errorBody.error || errorBody.message || `HTTP ${response.status}`,
      code: errorBody.code,
    })
  }

  return data as T
}

export const api = {
  get: <T>(path: string, options?: { query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
    request<T>('GET', path, options),

  post: <T>(path: string, options?: { body?: unknown; query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
    request<T>('POST', path, options),

  patch: <T>(path: string, options?: { body?: unknown; query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
    request<T>('PATCH', path, options),

  put: <T>(path: string, options?: { body?: unknown; query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
    request<T>('PUT', path, options),

  delete: <T>(path: string, options?: { body?: unknown; query?: Record<string, string | number | boolean | undefined>; headers?: Record<string, string> }) =>
    request<T>('DELETE', path, options),
}

// --- Typed API wrappers ---

export type Conversation = {
  id: string
  bookingId: string
  otherParticipantName: string
  otherParticipantId: string
  otherParticipantRole: string
  lastMessageContent: string | null
  lastMessageSentAt: string | null
  lastMessageSenderId: string | null
  unreadCount: number
}

export type Message = {
  id: string
  sender_id: string
  content: string
  sent_at: string
}

export type Booking = {
  id: string
  status: string
  scheduled_at: string
  professional_id: string
  professional_name?: string
  price_total?: number
  user_currency?: string
}

export type AvailabilityRule = {
  weekday: number
  start_time_local: string
  end_time_local: string
  is_active: boolean
}

export type AvailabilityException = {
  date_local: string
  is_available: boolean
  start_time_local: string | null
  end_time_local: string | null
}

export type ExistingBooking = {
  scheduled_at: string
  duration_minutes: number
}

export type ProfessionalAvailabilityResponse = {
  data: {
    rules: AvailabilityRule[]
    exceptions: AvailabilityException[]
    existingBookings: ExistingBooking[]
    timezone: string
    minimumNoticeHours: number
    maxBookingWindowDays: number
    sessionDurationMinutes: number
  }
}

export type PaymentIntentResponse = {
  clientSecret: string
  paymentIntentId: string
  status: string
}

export type ProfessionalSearchResult = {
  id: string
  user_id: string
  public_code: number
  status: string
  bio: string | null
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
  tier: string
  first_booking_enabled: boolean
  cover_photo_url: string | null
  video_intro_url: string | null
  whatsapp_number: string | null
  social_links: Record<string, unknown> | null
  market_code: string
  session_price: number | null
  session_price_currency: string | null
  profiles: {
    full_name: string | null
    country: string | null
    avatar_url: string | null
    role: string | null
  } | null
}

export type ProfessionalSearchResponse = {
  data: ProfessionalSearchResult[]
  nextCursor: string | null
  total: number
}

export type Review = {
  id: string
  rating: number
  comment: string | null
  professional_response: string | null
  profiles: {
    full_name: string | null
  } | null
}

export type ProfessionalDetailResponse = {
  data: {
    professional: ProfessionalSearchResult
    reviews: Review[]
  }
}

export const apiV1 = {
  auth: {
    signIn: (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string, metadata?: object) =>
      supabase.auth.signUp({ email, password, options: { data: metadata } }),
    signOut: () => supabase.auth.signOut(),
    getSession: () => supabase.auth.getSession(),
    getUser: () => supabase.auth.getUser(),
    resetPassword: (email: string) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${API_BASE_URL}/auth/callback`,
      }),
  },

  users: {
    me: () => api.get<{ user: { id: string; email?: string; full_name: string | null; role: string | null } }>('/api/v1/users/me'),
  },

  bookings: {
    list: (query?: { status?: string; limit?: number; offset?: number }) =>
      api.get<{ data: { bookings: Booking[]; total: number } }>('/api/v1/bookings', { query }),
    create: (body: { professionalId: string; scheduledAt?: string; notes?: string; bookingType?: 'one_off' | 'recurring' | 'batch' }) =>
      api.post<{ success: true; bookingId: string; createdBookingIds: string[] }>('/api/v1/bookings', { body }),
  },

  conversations: {
    list: () =>
      api.get<{ success: true; data: { conversations: Conversation[] } }>('/api/v1/conversations'),
    getMessages: (id: string, query?: { limit?: number; cursor?: string }) =>
      api.get<{ success: true; data: { messages: Message[]; nextCursor: string | null } }>(`/api/v1/conversations/${id}/messages`, { query }),
    sendMessage: (id: string, content: string) =>
      api.post<{ success: true; data: { messageId: string; sentAt: string } }>(`/api/v1/conversations/${id}/messages`, { body: { content } }),
    markAsRead: (id: string) =>
      api.patch<{ success: true; data: { updated: boolean } }>(`/api/v1/conversations/${id}/read`),
  },

  professionals: {
    search: (query?: {
      q?: string
      category?: string
      specialty?: string
      language?: string
      location?: string
      market?: string
      minPrice?: number
      maxPrice?: number
      cursor?: string
      limit?: number
    }) => api.get<ProfessionalSearchResponse>('/api/v1/professionals/search', { query }),
    getById: (id: string) => api.get<ProfessionalDetailResponse>(`/api/v1/professionals/${id}`),
    getAvailability: (id: string, query?: { startDate?: string; endDate?: string }) =>
      api.get<ProfessionalAvailabilityResponse>(`/api/v1/professionals/${id}/availability`, { query }),
  },

  payments: {
    createPaymentIntent: (body: { bookingId: string }) =>
      api.post<PaymentIntentResponse>('/api/v1/payments/payment-intent', { body }),
  },
}
