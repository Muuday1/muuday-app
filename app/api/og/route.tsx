import { ImageResponse } from '@vercel/og'

export const runtime = 'edge'

function decodeParam(value: string | null, fallback: string) {
  if (!value) return fallback
  try {
    const decoded = decodeURIComponent(value)
    return decoded.trim() || fallback
  } catch {
    return fallback
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = decodeParam(searchParams.get('name'), 'Profissional Muuday')
  const specialty = decodeParam(searchParams.get('specialty'), 'Atendimento por vídeo')
  const price = decodeParam(searchParams.get('price'), 'Consulte valores')
  const avatar = searchParams.get('avatar') || ''

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(135deg, #fcfaf6 0%, #f1e8db 45%, #e8dbc8 100%)',
          padding: 48,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            borderRadius: 28,
            padding: '38px 42px',
            background: '#fff',
            border: '1px solid #e9dfd2',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
              <div
                style={{
                  display: 'flex',
                  fontSize: 26,
                  color: '#6d5f4d',
                  marginBottom: 16,
                }}
              >
                Muuday
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 56,
                  lineHeight: 1.05,
                  fontWeight: 700,
                  color: '#22201b',
                }}
              >
                {name}
              </div>
              <div
                style={{
                  display: 'flex',
                  marginTop: 18,
                  fontSize: 30,
                  color: '#53483b',
                }}
              >
                {specialty}
              </div>
            </div>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 999,
                overflow: 'hidden',
                background: '#efe4d7',
                border: '4px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt="Avatar profissional"
                  width={160}
                  height={160}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : (
                <div style={{ fontSize: 52, color: '#6d5f4d' }}>{name.charAt(0).toUpperCase()}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontWeight: 600,
                color: '#2f2a23',
              }}
            >
              {price}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: '#6d5f4d',
              }}
            >
              Sessões por vídeo
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
