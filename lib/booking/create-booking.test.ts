import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeBookingCreation } from './create-booking'

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}))

vi.mock('./slot-locks', () => ({
  acquireSlotLock: vi.fn(),
  releaseSlotLock: vi.fn(),
}))

vi.mock('./slot-validation', () => ({
  validateSlotAvailability: vi.fn(),
}))

vi.mock('./payload-builders', () => ({
  buildOneOffBookingPayload: vi.fn(() => ({ payload: 'one_off' })),
  buildRecurringParentPayload: vi.fn(() => ({ payload: 'recurring_parent' })),
  buildRecurringChildPayloads: vi.fn(() => [{ payload: 'recurring_child' }]),
  buildRecurringSessionsPayload: vi.fn(() => [{ session: 1 }]),
  buildBatchBookingPayloads: vi.fn(() => [{ payload: 'batch' }]),
}))

vi.mock('./creation/lookup-context', () => ({
  lookupBookingContext: vi.fn(),
}))

vi.mock('./creation/prepare-slots', () => ({
  prepareBookingSlots: vi.fn(),
}))

vi.mock('./creation/calculate-price', () => ({
  calculateBookingPrice: vi.fn(),
}))

vi.mock('./creation/prepare-payment', () => ({
  prepareBookingPayment: vi.fn(),
}))

vi.mock('./creation/persist-one-off', () => ({
  persistOneOffBooking: vi.fn(),
}))

vi.mock('./creation/persist-recurring', () => ({
  persistRecurringBooking: vi.fn(),
}))

vi.mock('./creation/persist-batch', () => ({
  persistBatchBooking: vi.fn(),
}))

vi.mock('./creation/record-payment', () => ({
  recordBookingPayment: vi.fn(),
}))

vi.mock('./creation/logging', () => ({
  logBookingEvent: vi.fn(),
}))

import { acquireSlotLock, releaseSlotLock } from './slot-locks'
import { validateSlotAvailability } from './slot-validation'
import { lookupBookingContext } from './creation/lookup-context'
import { prepareBookingSlots } from './creation/prepare-slots'
import { calculateBookingPrice } from './creation/calculate-price'
import { prepareBookingPayment } from './creation/prepare-payment'
import { persistOneOffBooking } from './creation/persist-one-off'
import { persistRecurringBooking } from './creation/persist-recurring'
import { persistBatchBooking } from './creation/persist-batch'
import { recordBookingPayment } from './creation/record-payment'

const mockedAcquireSlotLock = vi.mocked(acquireSlotLock)
const mockedReleaseSlotLock = vi.mocked(releaseSlotLock)
const mockedValidateSlotAvailability = vi.mocked(validateSlotAvailability)
const mockedLookupBookingContext = vi.mocked(lookupBookingContext)
const mockedPrepareBookingSlots = vi.mocked(prepareBookingSlots)
const mockedCalculateBookingPrice = vi.mocked(calculateBookingPrice)
const mockedPrepareBookingPayment = vi.mocked(prepareBookingPayment)
const mockedPersistOneOffBooking = vi.mocked(persistOneOffBooking)
const mockedPersistRecurringBooking = vi.mocked(persistRecurringBooking)
const mockedPersistBatchBooking = vi.mocked(persistBatchBooking)
const mockedRecordBookingPayment = vi.mocked(recordBookingPayment)

function makeSupabase() {
  return { from: vi.fn() } as any
}

const baseUser = { id: 'user-1', email: 'user@example.com' }
const baseInput = { professionalId: 'pro-1', scheduledAt: '2026-04-25T10:00' }
const baseContext = {
  profile: { currency: 'BRL', timezone: 'America/Sao_Paulo' },
  professional: {
    id: 'pro-1',
    user_id: 'puser-1',
    session_price_brl: 150,
    session_duration_minutes: 60,
    status: 'approved',
    first_booking_enabled: true,
    tier: 'professional',
    profiles: { email: 'pro@example.com', full_name: 'Dr Pro' },
  },
  settings: {
    timezone: 'America/Sao_Paulo',
    sessionDurationMinutes: 60,
    bufferMinutes: 15,
    minimumNoticeHours: 24,
    maxBookingWindowDays: 30,
    enableRecurring: true,
    confirmationMode: 'auto_accept' as const,
    cancellationPolicyCode: 'standard',
    requireSessionPurpose: false,
  },
}
const baseSlot = {
  startUtc: new Date('2026-04-25T10:00:00Z'),
  endUtc: new Date('2026-04-25T11:00:00Z'),
  localScheduledAt: '2026-04-25T07:00:00',
}

describe('executeBookingCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedLookupBookingContext.mockResolvedValue(baseContext as any)
    mockedPrepareBookingSlots.mockReturnValue({
      plannedSessions: [baseSlot],
      recurrenceGroupId: null,
      batchBookingGroupId: null,
    })
    mockedValidateSlotAvailability.mockResolvedValue({ valid: true })
    mockedAcquireSlotLock.mockResolvedValue({ ok: true, lockId: 'lock-1' })
    mockedCalculateBookingPrice.mockResolvedValue({
      perSessionPriceUserCurrency: 150,
      totalPriceUserCurrency: 150,
    })
    mockedPrepareBookingPayment.mockReturnValue({
      paymentData: {
        user_id: 'user-1',
        professional_id: 'pro-1',
        provider: 'stripe' as const,
        amount_total: 150,
        currency: 'BRL',
        status: 'requires_payment' as const,
        metadata: {},
        captured_at: null,
      },
      paymentMetadata: {},
    })
    mockedPersistOneOffBooking.mockResolvedValue({
      bookingId: 'book-1',
      paymentAnchorBookingId: 'book-1',
      createdBookingIds: ['book-1'],
      usedAtomicPath: true,
    })
    mockedPersistRecurringBooking.mockResolvedValue({
      bookingId: 'book-parent',
      paymentAnchorBookingId: 'book-parent',
      createdBookingIds: ['book-parent', 'book-child'],
      usedAtomicPath: true,
    })
    mockedPersistBatchBooking.mockResolvedValue({
      bookingId: 'book-batch-1',
      paymentAnchorBookingId: 'book-batch-1',
      createdBookingIds: ['book-batch-1', 'book-batch-2'],
      usedAtomicPath: true,
    })
  })

  it('returns success for one_off booking', async () => {
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.bookingId).toBe('book-1')
      expect(result.usedAtomicPath).toBe(true)
      expect(result.professionalEmail).toBe('pro@example.com')
      expect(result.professionalName).toBe('Dr Pro')
    }
  })

  it('returns success for recurring booking', async () => {
    mockedPrepareBookingSlots.mockReturnValue({
      plannedSessions: [baseSlot, { ...baseSlot, startUtc: new Date('2026-05-02T10:00:00Z'), endUtc: new Date('2026-05-02T11:00:00Z'), localScheduledAt: '' }],
      recurrenceGroupId: 'rg-1',
      batchBookingGroupId: null,
    })
    const result = await executeBookingCreation(makeSupabase(), baseUser, {
      ...baseInput,
      bookingType: 'recurring',
      recurringPeriodicity: 'weekly',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.bookingId).toBe('book-parent')
      expect(result.createdBookingIds).toContain('book-parent')
    }
  })

  it('returns success for batch booking', async () => {
    mockedPrepareBookingSlots.mockReturnValue({
      plannedSessions: [baseSlot, { ...baseSlot, startUtc: new Date('2026-04-26T10:00:00Z'), endUtc: new Date('2026-04-26T11:00:00Z'), localScheduledAt: '' }],
      recurrenceGroupId: null,
      batchBookingGroupId: 'batch-1',
    })
    const result = await executeBookingCreation(makeSupabase(), baseUser, {
      ...baseInput,
      bookingType: 'batch',
      batchDates: ['2026-04-25T10:00', '2026-04-26T10:00'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.bookingId).toBe('book-batch-1')
    }
  })

  it('fails when lookup context fails', async () => {
    mockedLookupBookingContext.mockResolvedValue({ success: false, error: 'Profissional não encontrado.' })
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Profissional não encontrado.')
    }
  })

  it('fails when prepare slots fails', async () => {
    mockedPrepareBookingSlots.mockReturnValue({ success: false, error: 'Slot inválido.' })
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Slot inválido.')
    }
  })

  it('fails when slot validation fails', async () => {
    mockedValidateSlotAvailability.mockResolvedValue({ valid: false, error: 'Horário indisponível.' })
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('Horário indisponível.')
    }
  })

  it('fails when slot is locked by another user', async () => {
    mockedAcquireSlotLock.mockResolvedValue({ ok: false, reason: 'locked' })
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Outro cliente acabou de selecionar')
    }
  })

  it('fails when slot lock errors generically', async () => {
    mockedAcquireSlotLock.mockResolvedValue({ ok: false, reason: 'error' })
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Não foi possível reservar')
    }
  })

  it('releases previously acquired locks when a later lock fails', async () => {
    mockedPrepareBookingSlots.mockReturnValue({
      plannedSessions: [baseSlot, { ...baseSlot, startUtc: new Date('2026-04-26T10:00:00Z'), endUtc: new Date('2026-04-26T11:00:00Z'), localScheduledAt: '' }],
      recurrenceGroupId: null,
      batchBookingGroupId: null,
    })
    mockedAcquireSlotLock
      .mockResolvedValueOnce({ ok: true, lockId: 'lock-1' })
      .mockResolvedValueOnce({ ok: false, reason: 'locked' })

    await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(mockedReleaseSlotLock).toHaveBeenCalledWith(expect.anything(), 'lock-1')
  })

  it('fails when professional price is zero', async () => {
    mockedLookupBookingContext.mockResolvedValue({
      ...baseContext,
      professional: { ...baseContext.professional, session_price_brl: 0 },
    } as any)
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('preço configurado')
    }
  })

  it('fails when prepare payment throws', async () => {
    mockedPrepareBookingPayment.mockImplementation(() => {
      throw new Error('payment error')
    })
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('preparar pagamento')
    }
  })

  it('fails when persist one_off fails', async () => {
    mockedPersistOneOffBooking.mockResolvedValue({ success: false, error: 'DB error' })
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('DB error')
    }
  })

  it('falls back to record payment when atomic path not used', async () => {
    mockedPersistOneOffBooking.mockResolvedValue({
      bookingId: 'book-1',
      paymentAnchorBookingId: 'book-1',
      createdBookingIds: ['book-1'],
      usedAtomicPath: false,
    })
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(true)
    expect(mockedRecordBookingPayment).toHaveBeenCalled()
  })

  it('fails when record payment throws on fallback path', async () => {
    mockedPersistOneOffBooking.mockResolvedValue({
      bookingId: 'book-1',
      paymentAnchorBookingId: 'book-1',
      createdBookingIds: ['book-1'],
      usedAtomicPath: false,
    })
    mockedRecordBookingPayment.mockRejectedValue(new Error('stripe down'))
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Falha ao processar pagamento')
    }
  })

  it('releases all locks in finally on success', async () => {
    mockedPrepareBookingSlots.mockReturnValue({
      plannedSessions: [baseSlot, { ...baseSlot, startUtc: new Date('2026-04-26T10:00:00Z'), endUtc: new Date('2026-04-26T11:00:00Z'), localScheduledAt: '' }],
      recurrenceGroupId: null,
      batchBookingGroupId: null,
    })
    mockedAcquireSlotLock
      .mockResolvedValueOnce({ ok: true, lockId: 'lock-a' })
      .mockResolvedValueOnce({ ok: true, lockId: 'lock-b' })

    await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(mockedReleaseSlotLock).toHaveBeenCalledWith(expect.anything(), 'lock-a')
    expect(mockedReleaseSlotLock).toHaveBeenCalledWith(expect.anything(), 'lock-b')
  })

  it('releases all locks in finally on error', async () => {
    mockedPrepareBookingSlots.mockReturnValue({
      plannedSessions: [baseSlot, { ...baseSlot, startUtc: new Date('2026-04-26T10:00:00Z'), endUtc: new Date('2026-04-26T11:00:00Z'), localScheduledAt: '' }],
      recurrenceGroupId: null,
      batchBookingGroupId: null,
    })
    mockedAcquireSlotLock
      .mockResolvedValueOnce({ ok: true, lockId: 'lock-a' })
      .mockResolvedValueOnce({ ok: true, lockId: 'lock-b' })
    mockedPersistOneOffBooking.mockRejectedValue(new Error('unexpected'))

    await expect(executeBookingCreation(makeSupabase(), baseUser, baseInput)).rejects.toThrow('unexpected')
    expect(mockedReleaseSlotLock).toHaveBeenCalledWith(expect.anything(), 'lock-a')
    expect(mockedReleaseSlotLock).toHaveBeenCalledWith(expect.anything(), 'lock-b')
  })

  it('handles professional.profiles as array', async () => {
    mockedLookupBookingContext.mockResolvedValue({
      ...baseContext,
      professional: {
        ...baseContext.professional,
        profiles: [{ email: 'arr@example.com', full_name: 'Arr Pro' }],
      },
    } as any)
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.professionalEmail).toBe('arr@example.com')
      expect(result.professionalName).toBe('Arr Pro')
    }
  })

  it('sets confirmation deadline for manual confirmation mode', async () => {
    mockedLookupBookingContext.mockResolvedValue({
      ...baseContext,
      settings: { ...baseContext.settings, confirmationMode: 'manual' },
    } as any)
    const result = await executeBookingCreation(makeSupabase(), baseUser, baseInput)
    expect(result.success).toBe(true)
    expect(mockedPrepareBookingPayment).toHaveBeenCalled()
  })
})
