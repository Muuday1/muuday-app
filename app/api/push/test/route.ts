import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getClientIp } from '@/lib/http/client-ip'
import { sendPushToUser } from '@/lib/push/sender'

/**
 * POST /api/push/test
 * Sends a test push notification to the authenticated user.
 * Useful for verifying push subscription is working.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await rateLimit('notificationWrite', `push-test:${user.id}:${getClientIp(request)}`)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      { status: 429, headers: { 'Retry-After': String(Math.max(1, rl.retryAfterSeconds)) } },
    )
  }

  const sent = await sendPushToUser(
    user.id,
    {
      title: 'Muuday',
      body: 'Notificações push estão funcionando!',
      url: '/',
      tag: 'push-test',
    },
    { notifType: 'platform_update' },
  )

  if (sent === 0) {
    return NextResponse.json(
      {
        success: false,
        message: 'Nenhuma notificação enviada. Verifique se as notificações push estão ativadas no navegador.',
      },
      { status: 200 },
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Notificação de teste enviada com sucesso!',
    deliveredTo: sent,
  })
}
