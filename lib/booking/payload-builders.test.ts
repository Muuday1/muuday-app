import { describe, it, expect, vi } from 'vitest'
import {
  buildOneOffBookingPayload,
  buildRecurringParentPayload,
  buildRecurringChildPayloads,
  buildRecurringSessionsPayload,
  buildBatchBookingPayloads,
} from './payload-builders'

vi.mock('./cancellation-policy', () => ({
  buildCancellationPolicySnapshot: vi.fn((code: string) => ({
    code,
    refund_48h_or_more: 100,
    refund_24h_to_48h: 50,
    refund_under_24h: 0,
  })),
  roundCurrency: vi.fn((v: number) => Math.round(v * 100) / 100),
}))

const baseSlot = {
  startUtc: new Date('2026-04-25T10:00:00Z'),
  endUtc: new Date('2026-04-25T11:00:00Z'),
  localScheduledAt: '2026-04-25T07:00:00',
}

const baseSettings = {
  timezone: 'America/Sao_Paulo',
  sessionDurationMinutes: 60,
  bufferMinutes: 15,
  minimumNoticeHours: 24,
  maxBookingWindowDays: 30,
  enableRecurring: true,
  confirmationMode: 'auto_accept' as const,
  cancellationPolicyCode: 'standard',
  requireSessionPurpose: false,
}

describe('buildOneOffBookingPayload', () => {
  it('builds payload with correct fields', () => {
    const payload = buildOneOffBookingPayload({
      userId: 'user-1',
      professionalId: 'pro-1',
      slot: baseSlot,
      userTimezone: 'America/Sao_Paulo',
      bookingSettings: baseSettings,
      bookingStatus: 'pending_payment',
      confirmationDeadlineAt: null,
      priceBrl: 150,
      perSessionPriceUserCurrency: 150,
      currency: 'BRL',
      notes: 'hello',
      sessionPurpose: 'therapy',
    })

    expect(payload.user_id).toBe('user-1')
    expect(payload.professional_id).toBe('pro-1')
    expect(payload.booking_type).toBe('one_off')
    expect(payload.status).toBe('pending_payment')
    expect(payload.duration_minutes).toBe(60)
    expect(payload.price_brl).toBe(150)
    expect(payload.price_user_currency).toBe(150)
    expect(payload.price_total).toBe(150)
    expect(payload.user_currency).toBe('BRL')
    expect(payload.notes).toBe('hello')
    expect(payload.session_purpose).toBe('therapy')
    expect(payload.metadata.booking_source).toBe('web_checkout')
    expect(payload.metadata.booking_mode).toBe('one_off')
    expect(payload.metadata.confirmation_deadline_utc).toBeNull()
  })

  it('falls notes and session_purpose to null when omitted', () => {
    const payload = buildOneOffBookingPayload({
      userId: 'user-1',
      professionalId: 'pro-1',
      slot: baseSlot,
      userTimezone: 'America/Sao_Paulo',
      bookingSettings: baseSettings,
      bookingStatus: 'pending_payment',
      confirmationDeadlineAt: '2026-04-26T10:00:00Z',
      priceBrl: 150,
      perSessionPriceUserCurrency: 150,
      currency: 'BRL',
    })
    expect(payload.notes).toBeNull()
    expect(payload.session_purpose).toBeNull()
    expect(payload.metadata.confirmation_deadline_utc).toBe('2026-04-26T10:00:00Z')
  })
})

describe('buildRecurringParentPayload', () => {
  it('builds parent payload with correct fields', () => {
    const payload = buildRecurringParentPayload({
      userId: 'user-1',
      professionalId: 'pro-1',
      firstSlot: baseSlot,
      userTimezone: 'America/Sao_Paulo',
      bookingSettings: baseSettings,
      bookingStatus: 'pending_payment',
      confirmationDeadlineAt: null,
      priceBrl: 150,
      totalPriceUserCurrency: 450,
      perSessionPriceUserCurrency: 150,
      currency: 'BRL',
      sessionCount: 3,
      recurrenceGroupId: 'rg-1',
      recurrencePeriodicity: 'weekly',
      recurrenceIntervalDays: null,
      recurringEndDate: '2026-05-25',
      recurringAutoRenew: true,
      notes: null,
      sessionPurpose: null,
    })

    expect(payload.booking_type).toBe('recurring_parent')
    expect(payload.recurrence_group_id).toBe('rg-1')
    expect(payload.recurrence_periodicity).toBe('weekly')
    expect(payload.recurrence_interval_days).toBeNull()
    expect(payload.recurrence_end_date).toBe('2026-05-25')
    expect(payload.recurrence_occurrence_index).toBe(1)
    expect(payload.recurrence_auto_renew).toBe(true)
    expect(payload.price_brl).toBe(450) // 150 * 3
    expect(payload.price_total).toBe(450)
    expect(payload.metadata.recurring_sessions_count).toBe(3)
    expect(payload.metadata.recurring_auto_renew).toBe(true)
  })
})

describe('buildRecurringChildPayloads', () => {
  it('builds child payloads with parent as first slot', () => {
    const slots = [
      baseSlot,
      { startUtc: new Date('2026-05-02T10:00:00Z'), endUtc: new Date('2026-05-02T11:00:00Z'), localScheduledAt: '' },
    ]
    const payloads = buildRecurringChildPayloads(
      {
        userId: 'user-1',
        professionalId: 'pro-1',
        firstSlot: baseSlot,
        userTimezone: 'America/Sao_Paulo',
        bookingSettings: baseSettings,
        bookingStatus: 'pending_payment',
        confirmationDeadlineAt: null,
        priceBrl: 150,
        totalPriceUserCurrency: 300,
        perSessionPriceUserCurrency: 150,
        currency: 'BRL',
        sessionCount: 2,
        recurrenceGroupId: 'rg-1',
        recurrencePeriodicity: 'weekly',
        recurrenceIntervalDays: null,
      },
      slots,
    )

    expect(payloads).toHaveLength(2)
    expect(payloads[0].booking_type).toBe('recurring_parent')
    expect(payloads[0].parent_booking_id).toBeNull()
    expect(payloads[1].booking_type).toBe('recurring_child')
    expect(payloads[1].parent_booking_id).toBe('__PARENT_ID_PLACEHOLDER__')
    expect(payloads[0].metadata.recurring_session_number).toBe(1)
    expect(payloads[1].metadata.recurring_session_number).toBe(2)
  })

  it('uses recurrenceOccurrenceIndex when provided', () => {
    const slot = {
      ...baseSlot,
      recurrenceOccurrenceIndex: 5,
    }
    const payloads = buildRecurringChildPayloads(
      {
        userId: 'user-1',
        professionalId: 'pro-1',
        firstSlot: slot,
        userTimezone: 'America/Sao_Paulo',
        bookingSettings: baseSettings,
        bookingStatus: 'pending_payment',
        confirmationDeadlineAt: null,
        priceBrl: 150,
        totalPriceUserCurrency: 150,
        perSessionPriceUserCurrency: 150,
        currency: 'BRL',
        sessionCount: 1,
        recurrenceGroupId: 'rg-1',
        recurrencePeriodicity: 'weekly',
        recurrenceIntervalDays: null,
      },
      [slot],
    )
    expect(payloads[0].recurrence_occurrence_index).toBe(5)
  })
})

describe('buildRecurringSessionsPayload', () => {
  it('maps slots to session rows', () => {
    const slots = [
      baseSlot,
      { startUtc: new Date('2026-05-02T10:00:00Z'), endUtc: new Date('2026-05-02T11:00:00Z'), localScheduledAt: '' },
    ]
    const sessions = buildRecurringSessionsPayload(slots, 'pending_payment')
    expect(sessions).toHaveLength(2)
    expect(sessions[0].session_number).toBe(1)
    expect(sessions[1].session_number).toBe(2)
    expect(sessions[0].parent_booking_id).toBe('__PARENT_ID_PLACEHOLDER__')
    expect(sessions[0].status).toBe('pending_payment')
  })
})

describe('buildBatchBookingPayloads', () => {
  it('builds batch payloads with group id', () => {
    const slots = [
      baseSlot,
      { startUtc: new Date('2026-04-26T10:00:00Z'), endUtc: new Date('2026-04-26T11:00:00Z'), localScheduledAt: '' },
    ]
    const payloads = buildBatchBookingPayloads({
      userId: 'user-1',
      professionalId: 'pro-1',
      plannedSessions: slots,
      userTimezone: 'America/Sao_Paulo',
      bookingSettings: baseSettings,
      bookingStatus: 'pending_payment',
      confirmationDeadlineAt: null,
      priceBrl: 150,
      perSessionPriceUserCurrency: 150,
      currency: 'BRL',
      batchBookingGroupId: 'batch-1',
      notes: null,
      sessionPurpose: null,
    })

    expect(payloads).toHaveLength(2)
    expect(payloads[0].booking_type).toBe('one_off')
    expect(payloads[0].batch_booking_group_id).toBe('batch-1')
    expect(payloads[0].metadata.batch_group_id).toBe('batch-1')
    expect(payloads[0].metadata.batch_index).toBe(1)
    expect(payloads[1].metadata.batch_index).toBe(2)
    expect(payloads[0].metadata.booking_mode).toBe('batch')
  })
})
