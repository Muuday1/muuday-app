'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/security/rate-limit'
import { getPrimaryProfessionalForUser } from '@/lib/professional/current-professional'
import {
  upsertClientRecord as upsertClientRecordService,
  getClientRecords as getClientRecordsService,
  getClientRecordByUser as getClientRecordByUserService,
  upsertSessionNote as upsertSessionNoteService,
  getSessionNotesForClient as getSessionNotesForClientService,
} from '@/lib/client-records/client-records-service'
export type ClientRecordResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getAuthenticatedProfessional() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: professional } = await getPrimaryProfessionalForUser(supabase, user.id, 'id')
  if (!professional) {
    return { success: false, error: 'Apenas profissionais podem acessar registros de clientes.' } as const
  }

  return { supabase, userId: user.id, professionalId: professional.id }
}

export async function upsertClientRecord(
  userId: string,
  notes: string,
): Promise<ClientRecordResult<{ recordId: string }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem acessar registros de clientes.' }
  }

  const rl = await rateLimit('professionalProfile', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas alterações. Tente novamente em breve.' }

  return upsertClientRecordService(supabase, professionalId, userId, notes)
}

export async function getClientRecords(): Promise<ClientRecordResult<{ records: unknown[] }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem acessar registros de clientes.' }
  }

  const rl = await rateLimit('professionalProfile', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }

  return getClientRecordsService(supabase, professionalId)
}

export async function getClientRecordByUser(
  userId: string,
): Promise<ClientRecordResult<{ record: unknown | null }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem acessar registros de clientes.' }
  }

  return getClientRecordByUserService(supabase, professionalId, userId)
}

export async function upsertSessionNote(
  bookingId: string,
  notes: string,
  metadata?: { mood?: string; symptoms?: string },
): Promise<ClientRecordResult<{ noteId: string }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem criar notas de sessão.' }
  }

  const rl = await rateLimit('professionalProfile', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas alterações. Tente novamente em breve.' }

  return upsertSessionNoteService(supabase, professionalId, bookingId, notes, metadata)
}

export async function getSessionNotesForClient(
  userId: string,
): Promise<ClientRecordResult<{ notes: unknown[] }>> {
  const { supabase, professionalId } = await getAuthenticatedProfessional()
  if (typeof professionalId !== 'string') {
    return { success: false, error: 'Apenas profissionais podem acessar notas de sessão.' }
  }

  const rl = await rateLimit('professionalProfile', professionalId)
  if (!rl.allowed) return { success: false, error: 'Muitas requisições. Tente novamente em breve.' }

  return getSessionNotesForClientService(supabase, professionalId, userId)
}
