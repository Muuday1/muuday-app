import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'

export const emailSchema = z.string().trim().email('E-mail inválido.')
export const personNameSchema = z.string().trim().min(1, 'Nome obrigatório.').max(120, 'Nome muito longo.')
export const displayTextSchema = z.string().trim().min(1, 'Campo obrigatório.').max(200, 'Texto muito longo.')
export const messageSchema = z.string().trim().min(1, 'Campo obrigatório.').max(1200, 'Texto muito longo.')
export const shortOptionalMessageSchema = z.string().trim().max(1200, 'Texto muito longo.')
export const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
export const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido.')
export const timezoneSchema = z.string().trim().min(2, 'Fuso horário inválido.').max(80, 'Fuso horário inválido.')
export const amountSchema = z
  .string()
  .trim()
  .regex(/^\d+([.,]\d{1,2})?$/, 'Valor monetário inválido.')
export const urlSchema = z.string().trim().url('URL inválida.').max(500, 'URL muito longa.')
export const optionalUserIdSchema = z.string().uuid('Identificador de usuário inválido.').optional()
export const optionalCallToActionSubSchema = z.string().trim().max(240, 'Texto muito longo.').optional()
export const cancelledBySchema = z.enum(['user', 'professional'])
export const rescheduledBySchema = z.enum(['user', 'professional'])
export const ratingSchema = z.number().int().min(1).max(5)
export const missingItemsSchema = z.array(displayTextSchema).min(1, 'Lista de itens obrigatória.').max(20)

export function getValidationError(error: z.ZodError) {
  return error.issues[0]?.message || 'Dados inválidos.'
}

// helper - swallows errors so a failed email never breaks the main flow
export async function safe<T>(fn: () => Promise<T>, label: string) {
  try { return await fn() } catch (e) { console.error(`[email] ${label}`, e) }
}

// Auth guard - ensures only authenticated users can trigger emails + rate limit
export async function requireAuth(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const rl = await rateLimit('email', user.id)
  if (!rl.allowed) return null

  return user.id
}

export function parsePayload<T>(schema: z.ZodSchema<T>, payload: unknown): T | null {
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    console.warn('[email] invalid payload', getValidationError(parsed.error))
    return null
  }
  return parsed.data
}

/**
 * Security: Verify the caller has a legitimate relationship with the recipient.
 * Prevents IDOR where an authenticated user sends Muuday-branded emails to arbitrary addresses.
 * Returns true if the email is allowed, false otherwise.
 */
export async function assertCallerCanEmailRecipient(callerId: string, recipientEmail: string): Promise<boolean> {
  const supabase = createClient()

  // 1. Caller can always email themselves
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', callerId)
    .single()

  if (callerProfile?.email === recipientEmail) return true

  // 2. Caller has a booking relationship with the recipient
  const { data: recipientProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', recipientEmail)
    .maybeSingle()

  if (!recipientProfile) return false

  // Check if there's any booking between caller and recipient (as user<->professional)
  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .or(`and(user_id.eq.${callerId},professional_id.in.(select id from professionals where user_id='${recipientProfile.id}')),and(user_id.eq.${recipientProfile.id},professional_id.in.(select id from professionals where user_id='${callerId}'))`)
    .limit(1)

  return (bookingCount || 0) > 0
}

export type NotifKey = 'booking_emails' | 'session_reminders' | 'news_promotions'

// Returns false if the user has explicitly disabled this category
export async function canSend(userId: string | null | undefined, key: NotifKey): Promise<boolean> {
  if (!userId) return true // no user context -> always send (e.g. professional notifications)
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', userId)
      .single()
    const prefs = data?.notification_preferences as Record<string, boolean> | null
    if (!prefs) return true // no prefs saved -> default opt-in
    return prefs[key] !== false
  } catch {
    return true // on error -> send anyway
  }
}
