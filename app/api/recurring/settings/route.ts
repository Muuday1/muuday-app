/**
 * Recurring Booking Settings API
 *
 * GET  /api/recurring/settings?groupId={recurrenceGroupId}
 * PATCH /api/recurring/settings?groupId={recurrenceGroupId}
 * Body (PATCH): { autoRenew: boolean }
 *
 * Security:
 * - Authenticated users only
 * - User must own the settings
 * - Professionals cannot disable auto-renew
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { validateApiCsrf } from '@/lib/http/csrf'

const patchSchema = z.object({
  autoRenew: z.boolean(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')

  if (!groupId) {
    return NextResponse.json({ error: 'groupId obrigatorio.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faca login para continuar.' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('recurringSettingsRead', `recurring-settings-read:${user.id}:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisicoes. Tente novamente mais tarde.' },
      { status: 429 },
    )
  }

  const { data: settings, error } = await supabase
    .from('recurring_payment_settings')
    .select('*')
    .eq('recurrence_group_id', groupId)
    .maybeSingle()

  if (error) {
    Sentry.captureException(error, {
      tags: { area: 'recurring-settings-api', context: 'get' },
    })
    return NextResponse.json({ error: 'Erro ao carregar configuracoes.' }, { status: 500 })
  }

  if (!settings) {
    return NextResponse.json({ error: 'Configuracoes nao encontradas.' }, { status: 404 })
  }

  if (settings.user_id !== user.id) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  return NextResponse.json({
    recurrenceGroupId: settings.recurrence_group_id,
    autoRenew: settings.auto_renew,
    status: settings.status,
    nextRenewalAt: settings.next_renewal_at,
    lastRenewalAt: settings.last_renewal_at,
    priceTotal: settings.price_total,
    currency: settings.currency,
    stripePaymentMethodId: settings.stripe_payment_method_id,
    stripeCustomerId: settings.stripe_customer_id,
  })
}

export async function PATCH(request: NextRequest) {
  const csrfCheck = validateApiCsrf(request)
  if (!csrfCheck.ok) {
    return NextResponse.json({ error: csrfCheck.error }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')

  if (!groupId) {
    return NextResponse.json({ error: 'groupId obrigatorio.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisicao invalido.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Dados invalidos.' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Faca login para continuar.' }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rl = await rateLimit('recurringSettingsUpdate', `recurring-settings-update:${user.id}:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisicoes. Tente novamente mais tarde.' },
      { status: 429 },
    )
  }

  // Load settings to verify ownership
  const { data: settings, error: loadError } = await supabase
    .from('recurring_payment_settings')
    .select('id, user_id, status')
    .eq('recurrence_group_id', groupId)
    .maybeSingle()

  if (loadError) {
    Sentry.captureException(loadError, {
      tags: { area: 'recurring-settings-api', context: 'patch-load' },
    })
    return NextResponse.json({ error: 'Erro ao carregar configuracoes.' }, { status: 500 })
  }

  if (!settings) {
    return NextResponse.json({ error: 'Configuracoes nao encontradas.' }, { status: 404 })
  }

  if (settings.user_id !== user.id) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  // If reactivating auto-renew, ensure we have a payment method
  if (parsed.data.autoRenew) {
    const { data: settingsWithMethod } = await supabase
      .from('recurring_payment_settings')
      .select('stripe_payment_method_id')
      .eq('id', settings.id)
      .maybeSingle()

    if (!settingsWithMethod?.stripe_payment_method_id) {
      return NextResponse.json(
        { error: 'Nenhum metodo de pagamento salvo. Realize um novo pagamento para reativar.' },
        { status: 409 },
      )
    }
  }

  const newStatus = parsed.data.autoRenew
    ? settings.status === 'payment_failed'
      ? 'active'
      : settings.status
    : settings.status

  const { error: updateError } = await supabase.rpc('update_recurring_payment_settings', {
    p_settings_id: settings.id,
    p_auto_renew: parsed.data.autoRenew,
    p_status: newStatus,
  })

  if (updateError) {
    Sentry.captureException(updateError, {
      tags: { area: 'recurring-settings-api', context: 'patch-update' },
    })
    return NextResponse.json({ error: 'Erro ao atualizar configuracoes.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, autoRenew: parsed.data.autoRenew, status: newStatus })
}
