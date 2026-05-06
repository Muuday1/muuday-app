import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const userIdSchema = z.string().uuid('Identificador de usuário inválido.')
const notesSchema = z.string().trim().max(10000, 'Notas muito longas.')
const bookingIdSchema = z.string().uuid('Identificador de agendamento inválido.')

export type ClientRecordResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function upsertClientRecord(
  supabase: SupabaseClient,
  professionalId: string,
  userId: string,
  notes: string,
): Promise<ClientRecordResult<{ recordId: string }>> {
  const parsedUser = userIdSchema.safeParse(userId)
  if (!parsedUser.success) {
    return { success: false, error: parsedUser.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const parsedNotes = notesSchema.safeParse(notes)
  if (!parsedNotes.success) {
    return { success: false, error: parsedNotes.error.issues[0]?.message || 'Notas inválidas.' }
  }

  const { data, error } = await supabase
    .from('client_records')
    .upsert(
      {
        professional_id: professionalId,
        user_id: parsedUser.data,
        notes: parsedNotes.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'professional_id,user_id' },
    )
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: 'Erro ao salvar registro do cliente.' }
  }

  return { success: true, data: { recordId: data.id } }
}

export async function getClientRecords(
  supabase: SupabaseClient,
  professionalId: string,
): Promise<ClientRecordResult<{ records: unknown[] }>> {
  const { data, error } = await supabase
    .from('client_records')
    .select('id, user_id, notes, created_at, updated_at, profiles:user_id(full_name, email, avatar_url)')
    .eq('professional_id', professionalId)
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) {
    return { success: false, error: 'Erro ao carregar registros de clientes.' }
  }

  return { success: true, data: { records: data || [] } }
}

export async function getClientRecordByUser(
  supabase: SupabaseClient,
  professionalId: string,
  userId: string,
): Promise<ClientRecordResult<{ record: unknown | null }>> {
  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { data, error } = await supabase
    .from('client_records')
    .select('id, notes, created_at, updated_at')
    .eq('professional_id', professionalId)
    .eq('user_id', parsed.data)
    .maybeSingle()

  if (error) {
    return { success: false, error: 'Erro ao carregar registro do cliente.' }
  }

  return { success: true, data: { record: data } }
}

export async function upsertSessionNote(
  supabase: SupabaseClient,
  professionalId: string,
  bookingId: string,
  notes: string,
  metadata?: { mood?: string; symptoms?: string },
): Promise<ClientRecordResult<{ noteId: string }>> {
  const parsedBooking = bookingIdSchema.safeParse(bookingId)
  if (!parsedBooking.success) {
    return { success: false, error: parsedBooking.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const parsedNotes = notesSchema.safeParse(notes)
  if (!parsedNotes.success) {
    return { success: false, error: parsedNotes.error.issues[0]?.message || 'Notas inválidas.' }
  }

  const { data, error } = await supabase
    .from('session_notes')
    .upsert(
      {
        booking_id: parsedBooking.data,
        professional_id: professionalId,
        notes: parsedNotes.data,
        mood: metadata?.mood || null,
        symptoms: metadata?.symptoms || null,
        metadata: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'booking_id,professional_id' },
    )
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: 'Erro ao salvar nota de sessão.' }
  }

  return { success: true, data: { noteId: data.id } }
}

export async function getSessionNotesForClient(
  supabase: SupabaseClient,
  professionalId: string,
  userId: string,
): Promise<ClientRecordResult<{ notes: unknown[] }>> {
  const parsed = userIdSchema.safeParse(userId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Identificador inválido.' }
  }

  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', parsed.data)
    .eq('professional_id', professionalId)
    .limit(200)

  if (bookingsError) {
    return { success: false, error: 'Erro ao carregar notas de sessão.' }
  }

  const bookingIds = bookingsData?.map((b) => b.id) || []

  if (bookingIds.length === 0) {
    return { success: true, data: { notes: [] } }
  }

  const { data, error } = await supabase
    .from('session_notes')
    .select('id, booking_id, notes, mood, symptoms, created_at, updated_at, bookings:booking_id(scheduled_at, status)')
    .eq('professional_id', professionalId)
    .in('booking_id', bookingIds)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return { success: false, error: 'Erro ao carregar notas de sessão.' }
  }

  return { success: true, data: { notes: data || [] } }
}
