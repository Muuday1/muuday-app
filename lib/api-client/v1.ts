/**
 * Typed API client for Muuday /api/v1/* endpoints.
 * Import types from existing service modules to keep a single source of truth.
 */

import { createApiClient, type ApiClientConfig, type ApiClient, type ApiClientError } from './base'

// --- Re-export base types ---
export { ApiClientError }
export type { ApiClient, ApiClientConfig }

// --- Domain types (re-exported from services for mobile convenience) ---
export type { SignupCatalog } from '@/lib/taxonomy/signup-catalog-service'
export type { AdminDashboardData } from '@/lib/admin/admin-service'
export type { TaxonomyCatalog } from '@/lib/taxonomy/professional-specialties'
export type {
  TaxonomyData,
  TaxonomyItemInsert,
  TaxonomyItemUpdate,
  TaxonomyType,
} from '@/lib/admin/taxonomy-service'

// --- Booking types ---
export type { ManageBookingResult } from '@/lib/booking/manage-booking-service'
export type { RequestBookingResult } from '@/lib/booking/request-booking-service'

// --- Chat types ---
export type { ChatResult } from '@/lib/chat/chat-service'

// --- Notification types ---
export type { NotificationResult } from '@/lib/notifications/notification-service'

// --- Dispute types ---
export type { DisputeResult } from '@/lib/disputes/dispute-service'

// --- Client records types ---
export type { ClientRecordResult } from '@/lib/client-records/client-records-service'

// --- Review types ---
export type { ReviewResult } from '@/lib/review/review-service'

// --- Favorite types ---
export type { FavoriteResult } from '@/lib/favorites/favorites-service'

// --- User profile types ---
// intentionally omitted — service uses inline return types

// --- Professional profile types ---
// intentionally omitted — service uses inline return types

// --- Availability types ---
// intentionally omitted — service uses inline return types

// --- Service types ---
// intentionally omitted — service uses inline return types

// --- Onboarding types ---
export type { CompleteProfileResult } from '@/lib/onboarding/complete-profile-service'
export type { CompleteAccountResult } from '@/lib/onboarding/complete-account-service'

// --- KYC types ---
export type { OcrStatus, OcrProvider } from '@/lib/kyc/types'

// --- Blog / Guides types ---
// intentionally omitted — services use inline return types

// --- Push subscription types ---
export type WebPushSubscription = {
  platform: 'web'
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export type NativePushSubscription = {
  platform: 'ios' | 'android'
  pushToken: string
  deviceId?: string
  appVersion?: string
  osVersion?: string
  locale?: string
}

export type PushSubscription = WebPushSubscription | NativePushSubscription

// --- API response wrappers ---
export type ApiSuccess<T> = { success: true; data: T }
export type ApiErrorResponse = { success: false; error: string; code?: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse

// --- Typed client factory ---
export function createV1Client(config: ApiClientConfig) {
  const client = createApiClient({ ...config, baseUrl: `${config.baseUrl}/api/v1` })

  return {
    // --- Base client (for raw requests) ---
    raw: client,

    // --- Users ---
    users: {
      me: () =>
        client.get<{
          user: {
            id: string
            email: string | undefined
            full_name: string | null
            role: string | null
            avatar_url: string | null
            country: string | null
            timezone: string | null
            currency: string | null
            language: string | null
            created_at: string | null
          }
          professional: {
            id: string
            status: string
            tier: string | null
            market_code: string | null
            session_price: number | null
            session_price_currency: string | null
          } | null
        }>('/users/me'),

      updateMe: (body: { fullName?: string; country?: string; timezone?: string; currency?: string }) =>
        client.patch<{ success: true }>('/users/me', { body }),
    },

    // --- Onboarding ---
    onboarding: {
      completeAccount: (body: {
        role: 'usuario' | 'profissional'
        fullName: string
        country: string
        timezone: string
      }) => client.post<{ success: true }>('/onboarding/complete-account', { body }),

      completeProfile: (body: {
        bio: string
        category: string
        tags: string[]
        languages: string[]
        yearsExperience: number
        sessionPriceBrl: number
        sessionDurationMinutes: number
      }) => client.post<{ success: true; professionalId: string }>('/onboarding/complete-profile', { body }),
    },

    // --- Taxonomy ---
    taxonomy: {
      catalog: () => client.get<{ data: import('@/lib/taxonomy/signup-catalog-service').SignupCatalog }>('/taxonomy/catalog'),
    },

    // --- Professionals ---
    professionals: {
      search: (query: {
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
      }) =>
        client.get<{
          data: unknown[]
          nextCursor: string | null
          total: number
        }>('/professionals/search', { query }),

      getServices: (id: string) =>
        client.get<{ data: { services: unknown[] } }>(`/professionals/${id}/services`),

      me: {
        get: () => client.get<unknown>('/professionals/me'),
        createOrUpdate: (body: Record<string, unknown>) =>
          client.post<{ success: true; professionalId: string }>('/professionals/me', { body }),
        saveDraft: (body: Record<string, unknown>) =>
          client.patch<{ success: true }>('/professionals/me', { body }),
        submitForReview: () =>
          client.post<{ success: true; onboardingState: unknown }>('/professionals/me/submit-for-review'),

        availability: {
          get: () => client.get<unknown>('/professionals/me/availability'),
          update: (body: unknown) => client.post<unknown>('/professionals/me/availability', { body }),
        },

        availabilityExceptions: {
          list: () => client.get<unknown>('/professionals/me/availability-exceptions'),
          create: (body: unknown) => client.post<unknown>('/professionals/me/availability-exceptions', { body }),
          delete: (exceptionId: string) =>
            client.delete<unknown>(`/professionals/me/availability-exceptions/${exceptionId}`),
        },

        services: {
          list: () => client.get<unknown>('/professionals/me/services'),
          create: (body: unknown) => client.post<unknown>('/professionals/me/services', { body }),
          update: (serviceId: string, body: unknown) =>
            client.patch<unknown>(`/professionals/me/services/${serviceId}`, { body }),
          delete: (serviceId: string) =>
            client.delete<unknown>(`/professionals/me/services/${serviceId}`),
        },
      },
    },

    // --- Bookings ---
    bookings: {
      list: (query?: { status?: string; limit?: number; offset?: number }) =>
        client.get<{ data: { bookings: unknown[]; total: number } }>('/bookings', { query }),

      create: (body: {
        professionalId: string
        scheduledAt?: string
        notes?: string
        bookingType?: 'one_off' | 'recurring' | 'batch'
        sessionPurpose?: string
        batchDates?: string[]
      }) =>
        client.post<{ success: true; bookingId: string; createdBookingIds: string[] }>('/bookings', { body }),

      get: (id: string) => client.get<unknown>(`/bookings/${id}`),
      confirm: (id: string) => client.patch<unknown>(`/bookings/${id}/confirm`),
      cancel: (id: string, body?: { reason?: string }) =>
        client.patch<unknown>(`/bookings/${id}/cancel`, { body }),
      reschedule: (id: string, body: { newScheduledAt: string }) =>
        client.patch<unknown>(`/bookings/${id}/reschedule`, { body }),
      complete: (id: string) => client.patch<unknown>(`/bookings/${id}/complete`),
      addSessionLink: (id: string, body: { link: string }) =>
        client.patch<unknown>(`/bookings/${id}/session-link`, { body }),
      reportNoShow: (id: string) => client.post<unknown>(`/bookings/${id}/report-no-show`),
      markUserNoShow: (id: string) => client.post<unknown>(`/bookings/${id}/mark-user-no-show`),

      requests: {
        list: () => client.get<unknown>('/bookings/requests'),
        create: (body: unknown) => client.post<unknown>('/bookings/requests', { body }),
        get: (id: string) => client.get<unknown>(`/bookings/requests/${id}`),
        offer: (id: string, body: unknown) =>
          client.post<unknown>(`/bookings/requests/${id}/offer`, { body }),
        accept: (id: string) => client.post<unknown>(`/bookings/requests/${id}/accept`),
        declineProfessional: (id: string) =>
          client.post<unknown>(`/bookings/requests/${id}/decline-professional`),
        declineUser: (id: string) => client.post<unknown>(`/bookings/requests/${id}/decline-user`),
        cancelUser: (id: string) => client.post<unknown>(`/bookings/requests/${id}/cancel-user`),
      },
    },

    // --- Reviews ---
    reviews: {
      list: () => client.get<unknown>('/reviews'),
      create: (body: { bookingId: string; professionalId: string; rating: number; comment: string }) =>
        client.post<unknown>('/reviews', { body }),
      respond: (id: string, body: { responseText: string }) =>
        client.post<unknown>(`/reviews/${id}/response`, { body }),
    },

    // --- Favorites ---
    favorites: {
      list: () => client.get<unknown>('/favorites'),
      add: (body: { professionalId: string }) => client.post<unknown>('/favorites', { body }),
      remove: (body: { professionalId: string }) =>
        client.delete<unknown>('/favorites', { body }),
    },

    // --- Conversations ---
    conversations: {
      list: () =>
        client.get<{
          success: true
          data: {
            conversations: Array<{
              id: string
              bookingId: string
              otherParticipantName: string
              otherParticipantId: string
              otherParticipantRole: string
              lastMessageContent: string | null
              lastMessageSentAt: string | null
              lastMessageSenderId: string | null
              unreadCount: number
            }>
          }
        }>('/conversations'),

      getMessages: (id: string, query?: { limit?: number; cursor?: string }) =>
        client.get<{
          success: true
          data: { messages: unknown[]; nextCursor: string | null }
        }>(`/conversations/${id}/messages`, { query }),

      sendMessage: (id: string, body: { content: string }) =>
        client.post<{
          success: true
          data: { messageId: string; sentAt: string }
        }>(`/conversations/${id}/messages`, { body }),

      markAsRead: (id: string) =>
        client.post<{ success: true; data: { updated: boolean } }>(`/conversations/${id}/read`),
    },

    // --- Notifications ---
    notifications: {
      list: (query?: { limit?: number; cursor?: string; unreadOnly?: boolean }) =>
        client.get<{
          data: { notifications: unknown[]; nextCursor: string | null }
        }>('/notifications', { query }),

      markAsRead: (id: string) =>
        client.patch<{ data: { readAt: string } }>(`/notifications/${id}/read`),

      markAllAsRead: () =>
        client.patch<{ data: { updatedCount: number } }>('/notifications'),

      unreadCount: () =>
        client.get<{ data: { count: number } }>('/notifications/unread-count'),
    },

    // --- Disputes ---
    disputes: {
      list: () => client.get<unknown>('/disputes'),
      create: (body: { bookingId: string; reason: string; description: string }) =>
        client.post<unknown>('/disputes', { body }),
      get: (caseId: string) => client.get<unknown>(`/disputes/${caseId}`),
      addMessage: (caseId: string, body: { content: string }) =>
        client.post<unknown>(`/disputes/${caseId}/messages`, { body }),
    },

    // --- Client Records ---
    clientRecords: {
      list: () => client.get<unknown>('/client-records'),
      get: (userId: string) => client.get<unknown>(`/client-records/${userId}`),
      addNote: (body: { userId: string; content: string }) =>
        client.post<unknown>('/client-records/notes', { body }),
    },

    // --- Push ---
    push: {
      subscribe: (body: PushSubscription) =>
        client.post<{ success: true }>('/push/subscribe', { body }),
      unsubscribe: (body: { endpoint?: string; pushToken?: string }) =>
        client.delete<{ success: true }>('/push/unsubscribe', { body }),
    },

    // --- KYC ---
    kyc: {
      scan: (body: { credentialId: string; provider?: 'textract' | 'document-ai' | 'manual' }) =>
        client.post<{
          credentialId: string
          ocr: {
            provider: string
            status: string
            score: number
            fields: unknown[]
            error: string | null
          }
          triage: { decision: string; reason: string }
        }>('/kyc/scan', { body }),
    },

    // --- Blog (public) ---
    blog: {
      getComments: (slug: string) =>
        client.get<{ data: unknown }>('/blog/comments', { query: { slug } }),
      addComment: (body: { slug: string; name: string; email: string; content: string }) =>
        client.post<unknown>('/blog/comments', { body }),
      toggleLike: (body: { slug: string; visitorId: string }) =>
        client.post<{ success: true; liked: boolean }>('/blog/likes', { body }),
    },

    // --- Guides (public) ---
    guides: {
      toggleUseful: (body: { slug: string; visitorId: string }) =>
        client.post<{ success: true; marked: boolean }>('/guides/useful', { body }),
      report: (body: { slug: string; visitorId: string; message: string }) =>
        client.post<unknown>('/guides/reports', { body }),
    },

    // --- Admin ---
    admin: {
      dashboard: () =>
        client.get<{ data: import('@/lib/admin/admin-service').AdminDashboardData }>('/admin/dashboard'),

      plans: {
        get: () => client.get<unknown>('/admin/plans'),
        update: (body: unknown) => client.post<unknown>('/admin/plans', { body }),
      },

      taxonomy: {
        get: () => client.get<unknown>('/admin/taxonomy'),
        insert: (body: unknown) => client.post<unknown>('/admin/taxonomy/items', { body }),
        update: (id: string, body: { type: string; data: unknown }) =>
          client.patch<unknown>(`/admin/taxonomy/items/${id}`, { body }),
        toggleActive: (id: string, body: { type: string; currentActive: boolean }) =>
          client.patch<unknown>(`/admin/taxonomy/items/${id}/toggle-active`, { body }),
      },

      professionals: {
        updateStatus: (id: string, body: { status: string; note?: string }) =>
          client.patch<unknown>(`/admin/professionals/${id}/status`, { body }),
        updateFirstBookingGate: (id: string, body: { enabled: boolean; note?: string }) =>
          client.patch<unknown>(`/admin/professionals/${id}/first-booking-gate`, { body }),
        reviewDecision: (id: string, body: {
          decision: 'approved' | 'rejected' | 'needs_changes'
          note?: string
          adjustments?: Array<{
            stageId: string
            fieldKey: string
            message: string
            severity: 'low' | 'medium' | 'high'
          }>
        }) => client.post<unknown>(`/admin/professionals/${id}/review-decision`, { body }),
        restoreAdjustments: (id: string) =>
          client.post<unknown>(`/admin/professionals/${id}/restore-adjustments`),
      },

      reviews: {
        toggleVisibility: (id: string, body: { visible: boolean }) =>
          client.patch<unknown>(`/admin/reviews/${id}/visibility`, { body }),
        delete: (id: string) => client.delete<unknown>(`/admin/reviews/${id}`),
      },
    },
  }
}

export type V1Client = ReturnType<typeof createV1Client>
