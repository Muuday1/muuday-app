import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const payloadSchema = z.object({
  bio: z.string().trim().min(1).max(500),
})

function fallbackRewrite(input: string) {
  const sanitized = input.replace(/\s+/g, ' ').trim()
  if (sanitized.length <= 500) return sanitized
  return sanitized.slice(0, 500)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'profissional') {
    return NextResponse.json({ error: 'Apenas profissionais podem usar este recurso.' }, { status: 403 })
  }

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Texto inválido para melhoria.' }, { status: 400 })
  }

  const userBio = parsed.data.bio
  const openAiKey = process.env.OPENAI_API_KEY

  if (!openAiKey) {
    return NextResponse.json({ bio: fallbackRewrite(userBio), source: 'fallback' })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL_PROFILE_REWRITE || 'gpt-5-mini',
        input: [
          {
            role: 'system',
            content:
              'Você reescreve textos profissionais em português brasileiro de forma clara, objetiva e ética. Não invente credenciais, não adicione promessas e mantenha tom humano. Responda apenas com o texto final.',
          },
          {
            role: 'user',
            content: `Reescreva este texto para perfil público, mantendo o sentido e até 500 caracteres:\n\n${userBio}`,
          },
        ],
        text: { verbosity: 'low' },
      }),
    })

    if (!response.ok) {
      const fallback = fallbackRewrite(userBio)
      return NextResponse.json({ bio: fallback, source: 'fallback' })
    }

    const json = (await response.json()) as {
      output_text?: string
    }
    const rewritten = fallbackRewrite(String(json.output_text || userBio))
    return NextResponse.json({ bio: rewritten, source: 'openai' })
  } catch {
    return NextResponse.json({ bio: fallbackRewrite(userBio), source: 'fallback' })
  }
}
