/**
 * Shared Zod schemas for API v1 endpoints.
 * Used for input validation, OpenAPI generation, and contract tests.
 */

import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

// ─── Common / Reusable ─────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid().openapi({ description: 'UUID v4', example: '550e8400-e29b-41d4-a716-446655440000' })

export const isoDateTimeSchema = z.string().datetime().openapi({ description: 'ISO 8601 datetime', example: '2026-05-01T14:00:00Z' })

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().openapi({ description: 'Max items per page', example: 20 }),
  offset: z.coerce.number().min(0).optional().openapi({ description: 'Items to skip', example: 0 }),
}).optional()

export const cursorPaginationQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().openapi({ description: 'Max items per page', example: 20 }),
  cursor: z.string().optional().openapi({ description: 'Opaque cursor for pagination', example: '2026-04-27T10:00:00Z' }),
}).optional()

// ─── Error Responses ───────────────────────────────────────────────────────

export const apiErrorSchema = z.object({
  error: z.string().openapi({ description: 'Human-readable error message', example: 'Unauthorized' }),
  code: z.string().optional().openapi({ description: 'Machine-readable error code', example: 'RATE_LIMITED' }),
  reasonCode: z.string().optional().openapi({ description: 'Business reason code', example: 'SLOT_UNAVAILABLE' }),
}).openapi('ApiError')

export const apiValidationErrorSchema = z.object({
  error: z.string(),
  details: z.array(z.object({
    path: z.array(z.string()),
    message: z.string(),
    code: z.string(),
  })).optional(),
}).openapi('ApiValidationError')

// ─── Users ─────────────────────────────────────────────────────────────────

export const userSchema = z.object({
  id: uuidSchema,
  email: z.string().email().nullable().openapi({ example: 'usuario@exemplo.com' }),
  full_name: z.string().nullable().openapi({ example: 'Maria Silva' }),
  role: z.enum(['usuario', 'profissional', 'admin']).nullable().openapi({ example: 'usuario' }),
  avatar_url: z.string().url().nullable().openapi({ example: 'https://cdn.muuday.com/avatars/maria.jpg' }),
  country: z.string().nullable().openapi({ example: 'BR' }),
  timezone: z.string().nullable().openapi({ example: 'America/Sao_Paulo' }),
  currency: z.string().nullable().openapi({ example: 'BRL' }),
  language: z.string().nullable().openapi({ example: 'pt-BR' }),
  created_at: z.string().nullable().openapi({ example: '2026-01-15T10:00:00Z' }),
}).openapi('User')

export const professionalSummarySchema = z.object({
  id: uuidSchema,
  status: z.string().openapi({ example: 'approved' }),
  tier: z.string().nullable().openapi({ example: 'pro' }),
  market_code: z.string().nullable().openapi({ example: 'BR' }),
  session_price: z.number().nullable().openapi({ example: 150.00 }),
  session_price_currency: z.string().nullable().openapi({ example: 'BRL' }),
}).openapi('ProfessionalSummary')

export const userMeResponseSchema = z.object({
  user: userSchema,
  professional: professionalSummarySchema.nullable(),
}).openapi('UserMeResponse')

export const updateUserBodySchema = z.object({
  fullName: z.string().trim().min(1).max(200).optional(),
  country: z.string().length(2).optional(),
  timezone: z.string().optional(),
  currency: z.string().length(3).optional(),
}).openapi('UpdateUserBody')

// ─── Bookings ──────────────────────────────────────────────────────────────

export const bookingStatusSchema = z.enum([
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
  'rescheduled',
]).openapi('BookingStatus')

export const bookingSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  professional_id: uuidSchema,
  scheduled_at: z.string().openapi({ example: '2026-05-01T14:00:00' }),
  start_time_utc: z.string().openapi({ example: '2026-05-01T17:00:00Z' }),
  end_time_utc: z.string().openapi({ example: '2026-05-01T18:00:00Z' }),
  duration_minutes: z.number().openapi({ example: 60 }),
  status: bookingStatusSchema,
  session_link: z.string().url().nullable().openapi({ example: 'https://meet.muuday.com/sessao-abc123' }),
  timezone_user: z.string().nullable(),
  timezone_professional: z.string().nullable(),
  booking_type: z.enum(['one_off', 'recurring', 'batch']).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  cancellation_reason: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
}).openapi('Booking')

export const bookingsListResponseSchema = z.object({
  data: z.object({
    bookings: z.array(bookingSchema),
    total: z.number().openapi({ description: 'Total bookings matching query', example: 42 }),
  }),
}).openapi('BookingsListResponse')

export const createBookingBodySchema = z.object({
  professionalId: uuidSchema,
  scheduledAt: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
  sessionPurpose: z.string().trim().max(1200).optional(),
  bookingType: z.enum(['one_off', 'recurring', 'batch']).optional(),
  recurringPeriodicity: z.enum(['weekly', 'biweekly', 'monthly', 'custom_days']).optional(),
  recurringIntervalDays: z.number().int().min(1).max(365).optional(),
  recurringOccurrences: z.number().int().min(2).max(52).optional(),
  recurringSessionsCount: z.number().int().min(2).max(52).optional(),
  recurringEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recurringAutoRenew: z.boolean().optional(),
  batchDates: z.array(z.string()).min(2).max(20).optional(),
}).openapi('CreateBookingBody')

export const createBookingResponseSchema = z.object({
  success: z.literal(true),
  bookingId: uuidSchema,
  createdBookingIds: z.array(uuidSchema),
  usedAtomicPath: z.boolean().optional(),
}).openapi('CreateBookingResponse')

// ─── Conversations / Chat ──────────────────────────────────────────────────

export const conversationSchema = z.object({
  id: uuidSchema,
  bookingId: uuidSchema,
  otherParticipantName: z.string().openapi({ example: 'Dr. João Pereira' }),
  otherParticipantId: uuidSchema,
  otherParticipantRole: z.string().openapi({ example: 'profissional' }),
  lastMessageContent: z.string().nullable().openapi({ example: 'Olá, tudo bem?' }),
  lastMessageSentAt: z.string().nullable().openapi({ example: '2026-04-27T14:30:00Z' }),
  lastMessageSenderId: uuidSchema.nullable(),
  unreadCount: z.number().int().min(0).openapi({ example: 3 }),
}).openapi('Conversation')

export const conversationsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    conversations: z.array(conversationSchema),
  }),
}).openapi('ConversationsListResponse')

export const messageSchema = z.object({
  id: uuidSchema,
  sender_id: uuidSchema,
  content: z.string().openapi({ example: 'Olá, tudo bem?' }),
  sent_at: z.string().openapi({ example: '2026-04-27T14:30:00Z' }),
  edited_at: z.string().nullable().optional(),
  is_deleted: z.boolean().optional(),
}).openapi('Message')

export const messagesListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    messages: z.array(messageSchema),
    nextCursor: z.string().nullable().openapi({ description: 'Cursor for next page', example: '2026-04-27T14:00:00Z' }),
  }),
}).openapi('MessagesListResponse')

export const sendMessageBodySchema = z.object({
  content: z.string().trim().min(1).max(4000).openapi({ description: 'Message content', example: 'Olá!' }),
}).openapi('SendMessageBody')

export const sendMessageResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    messageId: uuidSchema,
    sentAt: z.string().openapi({ example: '2026-04-27T14:30:00Z' }),
  }),
}).openapi('SendMessageResponse')

export const markReadResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    updated: z.boolean(),
  }),
}).openapi('MarkReadResponse')

// ─── Notifications ─────────────────────────────────────────────────────────

export const notificationSchema = z.object({
  id: uuidSchema,
  booking_id: uuidSchema.nullable(),
  type: z.string().openapi({ example: 'booking_confirmed' }),
  title: z.string().openapi({ example: 'Agendamento confirmado' }),
  body: z.string().openapi({ example: 'Seu agendamento com Dr. João foi confirmado.' }),
  payload: z.record(z.string(), z.unknown()).nullable(),
  read_at: z.string().nullable().openapi({ example: '2026-04-27T14:30:00Z' }),
  created_at: z.string().openapi({ example: '2026-04-27T14:00:00Z' }),
}).openapi('Notification')

export const notificationsListResponseSchema = z.object({
  data: z.object({
    notifications: z.array(notificationSchema),
    nextCursor: z.string().nullable(),
  }),
}).openapi('NotificationsListResponse')

export const unreadCountResponseSchema = z.object({
  data: z.object({
    count: z.number().int().min(0).openapi({ example: 5 }),
  }),
}).openapi('UnreadCountResponse')

// ─── Professionals / Search ────────────────────────────────────────────────

export const professionalSearchQuerySchema = z.object({
  q: z.string().optional().default(''),
  category: z.string().optional(),
  specialty: z.string().optional(),
  language: z.string().optional(),
  location: z.string().optional(),
  market: z.string().optional().default('BR'),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
}).openapi('ProfessionalSearchQuery')

export const professionalSearchResultSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown()).openapi({ description: 'Professional record from Supabase' })),
  nextCursor: z.string().nullable(),
  total: z.number().int().min(0),
}).openapi('ProfessionalSearchResult')

// ─── Export all as a map for OpenAPI generation ────────────────────────────

export const apiV1Schemas = {
  ApiError: apiErrorSchema,
  ApiValidationError: apiValidationErrorSchema,
  User: userSchema,
  ProfessionalSummary: professionalSummarySchema,
  UserMeResponse: userMeResponseSchema,
  UpdateUserBody: updateUserBodySchema,
  Booking: bookingSchema,
  BookingsListResponse: bookingsListResponseSchema,
  CreateBookingBody: createBookingBodySchema,
  CreateBookingResponse: createBookingResponseSchema,
  Conversation: conversationSchema,
  ConversationsListResponse: conversationsListResponseSchema,
  Message: messageSchema,
  MessagesListResponse: messagesListResponseSchema,
  SendMessageBody: sendMessageBodySchema,
  SendMessageResponse: sendMessageResponseSchema,
  MarkReadResponse: markReadResponseSchema,
  Notification: notificationSchema,
  NotificationsListResponse: notificationsListResponseSchema,
  UnreadCountResponse: unreadCountResponseSchema,
  ProfessionalSearchQuery: professionalSearchQuerySchema,
  ProfessionalSearchResult: professionalSearchResultSchema,
} as const
