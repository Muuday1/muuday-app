/**
 * Contract tests for API v1 response schemas.
 *
 * These tests validate that example responses conform to the Zod schemas.
 * If a backend developer changes a response field without updating the schema,
 * these tests fail and block the PR.
 */

import { describe, it, expect } from 'vitest'
import {
  userMeResponseSchema,
  bookingsListResponseSchema,
  createBookingResponseSchema,
  conversationsListResponseSchema,
  messagesListResponseSchema,
  sendMessageResponseSchema,
  markReadResponseSchema,
  notificationsListResponseSchema,
  unreadCountResponseSchema,
  professionalSearchResultSchema,
} from './api-v1'

describe('API v1 contract: response schemas', () => {
  it('UserMeResponse matches expected shape', () => {
    const example = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'maria@exemplo.com',
        full_name: 'Maria Silva',
        role: 'usuario',
        avatar_url: 'https://cdn.muuday.com/avatars/maria.jpg',
        country: 'BR',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        created_at: '2026-01-15T10:00:00Z',
      },
      professional: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'approved',
        tier: 'pro',
        market_code: 'BR',
        session_price: 150.0,
        session_price_currency: 'BRL',
      },
    }
    expect(() => userMeResponseSchema.parse(example)).not.toThrow()
  })

  it('UserMeResponse allows null professional', () => {
    const example = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'joao@exemplo.com',
        full_name: 'João Pereira',
        role: 'usuario',
        avatar_url: null,
        country: null,
        timezone: null,
        currency: null,
        language: null,
        created_at: null,
      },
      professional: null,
    }
    expect(() => userMeResponseSchema.parse(example)).not.toThrow()
  })

  it('BookingsListResponse matches expected shape', () => {
    const example = {
      data: {
        bookings: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            user_id: '550e8400-e29b-41d4-a716-446655440001',
            professional_id: '550e8400-e29b-41d4-a716-446655440002',
            scheduled_at: '2026-05-01T14:00:00',
            start_time_utc: '2026-05-01T17:00:00Z',
            end_time_utc: '2026-05-01T18:00:00Z',
            duration_minutes: 60,
            status: 'confirmed',
            session_link: 'https://meet.muuday.com/sessao-abc123',
            timezone_user: 'America/Sao_Paulo',
            timezone_professional: 'America/Sao_Paulo',
            booking_type: 'one_off',
            metadata: null,
            cancellation_reason: null,
            created_at: '2026-04-20T10:00:00Z',
            updated_at: '2026-04-20T10:00:00Z',
          },
        ],
        total: 1,
      },
    }
    expect(() => bookingsListResponseSchema.parse(example)).not.toThrow()
  })

  it('CreateBookingResponse matches expected shape', () => {
    const example = {
      success: true,
      bookingId: '550e8400-e29b-41d4-a716-446655440000',
      createdBookingIds: ['550e8400-e29b-41d4-a716-446655440000'],
      usedAtomicPath: true,
    }
    expect(() => createBookingResponseSchema.parse(example)).not.toThrow()
  })

  it('ConversationsListResponse matches expected shape', () => {
    const example = {
      success: true,
      data: {
        conversations: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            bookingId: '550e8400-e29b-41d4-a716-446655440001',
            otherParticipantName: 'Dr. João Pereira',
            otherParticipantId: '550e8400-e29b-41d4-a716-446655440002',
            otherParticipantRole: 'profissional',
            lastMessageContent: 'Olá, tudo bem?',
            lastMessageSentAt: '2026-04-27T14:30:00Z',
            lastMessageSenderId: '550e8400-e29b-41d4-a716-446655440002',
            unreadCount: 3,
          },
        ],
      },
    }
    expect(() => conversationsListResponseSchema.parse(example)).not.toThrow()
  })

  it('MessagesListResponse matches expected shape', () => {
    const example = {
      success: true,
      data: {
        messages: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            sender_id: '550e8400-e29b-41d4-a716-446655440001',
            content: 'Olá, tudo bem?',
            sent_at: '2026-04-27T14:30:00Z',
            edited_at: null,
            is_deleted: false,
          },
        ],
        nextCursor: null,
      },
    }
    expect(() => messagesListResponseSchema.parse(example)).not.toThrow()
  })

  it('SendMessageResponse matches expected shape', () => {
    const example = {
      success: true,
      data: {
        messageId: '550e8400-e29b-41d4-a716-446655440000',
        sentAt: '2026-04-27T14:30:00Z',
      },
    }
    expect(() => sendMessageResponseSchema.parse(example)).not.toThrow()
  })

  it('MarkReadResponse matches expected shape', () => {
    const example = {
      success: true,
      data: {
        updated: true,
      },
    }
    expect(() => markReadResponseSchema.parse(example)).not.toThrow()
  })

  it('NotificationsListResponse matches expected shape', () => {
    const example = {
      data: {
        notifications: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            booking_id: '550e8400-e29b-41d4-a716-446655440001',
            type: 'booking_confirmed',
            title: 'Agendamento confirmado',
            body: 'Seu agendamento com Dr. João foi confirmado.',
            payload: { bookingId: '550e8400-e29b-41d4-a716-446655440001' },
            read_at: null,
            created_at: '2026-04-27T14:00:00Z',
          },
        ],
        nextCursor: null,
      },
    }
    expect(() => notificationsListResponseSchema.parse(example)).not.toThrow()
  })

  it('UnreadCountResponse matches expected shape', () => {
    const example = {
      data: {
        count: 5,
      },
    }
    expect(() => unreadCountResponseSchema.parse(example)).not.toThrow()
  })

  it('ProfessionalSearchResult matches expected shape', () => {
    const example = {
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          full_name: 'Dr. João Pereira',
          status: 'approved',
        },
      ],
      nextCursor: null,
      total: 1,
    }
    expect(() => professionalSearchResultSchema.parse(example)).not.toThrow()
  })

  // ─── Negative cases ──────────────────────────────────────────────────────

  it('rejects missing required fields', () => {
    const bad = { data: { bookings: [{ id: 'not-a-uuid' }] } }
    expect(() => bookingsListResponseSchema.parse(bad)).toThrow()
  })

  it('rejects wrong booking status', () => {
    const bad = {
      data: {
        bookings: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            user_id: '550e8400-e29b-41d4-a716-446655440001',
            professional_id: '550e8400-e29b-41d4-a716-446655440002',
            scheduled_at: '2026-05-01T14:00:00',
            start_time_utc: '2026-05-01T17:00:00Z',
            end_time_utc: '2026-05-01T18:00:00Z',
            duration_minutes: 60,
            status: 'invalid_status',
            session_link: null,
            timezone_user: null,
            timezone_professional: null,
            booking_type: null,
            metadata: null,
            cancellation_reason: null,
            created_at: '2026-04-20T10:00:00Z',
            updated_at: '2026-04-20T10:00:00Z',
          },
        ],
        total: 1,
      },
    }
    expect(() => bookingsListResponseSchema.parse(bad)).toThrow()
  })
})
