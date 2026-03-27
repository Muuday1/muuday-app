import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstname, email, pais_residencia, tipo_lead, origem_lead } = body

    if (!email || !firstname) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient()

    // Save to waitlist table
    const { error: dbError } = await supabase
      .from('waitlist')
      .upsert({
        email,
        firstname,
        country: pais_residencia || null,
        tipo_lead: tipo_lead || 'usuario',
        origem_lead: origem_lead || null,
        status: 'na_lista',
      }, { onConflict: 'email' })

    if (dbError) {
      console.error('[waitlist] DB error:', dbError)
      // Don't fail — still send the email
    }

    // Send confirmation email + add to Resend audience (non-blocking).
    void (async () => {
      try {
        const { sendWaitlistConfirmationEmail, addContactToResend, SEGMENTS } = await import('@/lib/email/resend')
        await Promise.all([
          sendWaitlistConfirmationEmail(email, firstname),
          addContactToResend(email, firstname, SEGMENTS.waitlist),
        ])
      } catch (e) {
        console.error('[waitlist] Email error:', e)
      }
    })()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[waitlist] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Allow CORS from the landing page domain
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
