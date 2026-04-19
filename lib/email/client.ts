import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[email/resend] RESEND_API_KEY missing. Email delivery disabled.')
    }
    return null
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey)
  }

  return resendClient
}

export function sendEmail(payload: Parameters<Resend['emails']['send']>[0]) {
  const client = getResendClient()
  if (!client) {
    return Promise.resolve({
      data: null,
      error: { message: 'RESEND_API_KEY missing' },
    } as Awaited<ReturnType<Resend['emails']['send']>>)
  }

  return client.emails.send(payload)
}

// ─── Resend Topics (notification preferences) ─────────────────────────────
export const TOPICS = {
  agendamentos: '810ece2f-4e43-4214-ad94-2a2f628806ee',
  lembretes:    'ffdef00a-0e97-4ccf-80a9-695dbed7e11e',
  novidades:    '9882500d-3801-43b2-9ef4-98c1bdbede27',
}

// ─── Resend Segments ──────────────────────────────────────────────────────
export const SEGMENTS = {
  waitlist:    'e0503d46-8a25-4b74-8615-96d82e3b19e1',
  usuarios:    '64e6c00e-143f-4759-be90-d54c88a53d0e',
  general:     'f6979342-5de0-4383-b617-cf4f0a277ecc',
}

// ─── Add contact to Resend audience ──────────────────────────────────────
export async function addContactToResend(
  email: string,
  firstName: string,
  segmentId: string,
) {
  try {
    const client = getResendClient()
    if (!client) return

    await client.contacts.create({
      email,
      firstName,
      unsubscribed: false,
      audienceId: segmentId,
    })
  } catch {
    // Non-blocking — don't fail the main flow if this errors
  }
}
