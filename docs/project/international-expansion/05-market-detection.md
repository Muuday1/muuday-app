# Detecção e Direcionamento de Mercado

> Data: 2026-04-23  
> Status: Especificação técnica  
> Escopo: Como determinamos se o usuário quer Brasil, México, Portugal ou outro mercado.

---

## 1. O Problema Fundamental

Um usuário que acessa `muuday.com` pode ser:
- **Brasileiro morando no Brasil** → quer mercado BR
- **Brasileiro morando em Londres** → quer mercado BR
- **Brasileiro morando no México** → quer mercado BR
- **Mexicano morando nos EUA** → quer mercado MX
- **Mexicano morando na Espanha** → quer mercado MX
- **Mexicano morando no Brasil** → quer mercado MX
- **Português morando em França** → quer mercado PT
- **Americano curioso** → não sabemos, default BR ou mostrar seleção

**A geolocalização por IP NÃO resolve o problema.** Ela diz onde a pessoa ESTÁ, não de onde ela É nem qual mercado ela quer.

---

## 2. Sinais de Detecção (Prioridade Ordenada)

### 2.1 Cookie Persistente (Máxima Prioridade)
Se o usuário já escolheu um mercado antes, respeitamos essa escolha.

```ts
const cookieMarket = request.cookies.get('muuday_market')?.value
if (cookieMarket && MARKETS[cookieMarket]) {
  return cookieMarket  // Não questionamos mais
}
```

**Cookie config:**
- Nome: `muuday_market`
- Duração: 1 ano
- Secure: true (produção)
- SameSite: lax
- HttpOnly: false (precisa ser lido pelo client para UI)

### 2.2 Parâmetro de URL (Alta Prioridade)
O usuário pode compartilhar um link com mercado explícito:
- `muuday.com/?market=mx`
- `muuday.com/br/` (quando implementarmos locale routing)

```ts
const urlMarket = request.nextUrl.searchParams.get('market')?.toUpperCase()
if (urlMarket && MARKETS[urlMarket]) {
  return urlMarket
}
```

### 2.3 Accept-Language do Browser (Alta Prioridade)
O idioma do navegador é o melhor indicador de "de onde a pessoa é" (melhor que IP).

```ts
const acceptLang = request.headers.get('accept-language') // "es-MX,es;q=0.9,en;q=0.8"

function detectMarketFromLanguage(acceptLang: string | null): string | null {
  if (!acceptLang) return null
  
  const languages = acceptLang.split(',').map(lang => {
    const [code, q = '1'] = lang.trim().split(';q=')
    return { code: code.trim().toLowerCase(), q: parseFloat(q) }
  }).sort((a, b) => b.q - a.q)
  
  for (const { code } of languages) {
    // Espanhol mexicano ou genérico
    if (code === 'es-mx' || code === 'es') return 'MX'
    
    // Português brasileiro
    if (code === 'pt-br') return 'BR'
    
    // Português europeu
    if (code === 'pt-pt' || code === 'pt') return 'PT'
    
    // Inglês — não sabemos, pode ser qualquer mercado
    if (code.startsWith('en')) return null
  }
  
  return null
}
```

**Nota:** Um brasileiro em Londres provavelmente tem `pt-BR` no Accept-Language. Um mexicano em Nova York provavelmente tem `es-MX` ou `es`.

### 2.4 IP Geolocation (Média Prioridade)
Usar apenas como fallback ou para desempatar.

```ts
const ipCountry = request.headers.get('x-vercel-ip-country')?.toUpperCase()
// ou cf-ipcountry se usar Cloudflare

function detectMarketFromIP(ipCountry: string | null): string | null {
  if (!ipCountry) return null
  if (ipCountry === 'BR') return 'BR'
  if (ipCountry === 'MX') return 'MX'
  if (ipCountry === 'PT') return 'PT'
  return null
}
```

**Problemas conhecidos:**
- Brasileiro em Londres → IP UK → detectaria UK (errado)
- Mexicano em Nova York → IP US → detectaria US (errado)
- VPNs falsificam IP

### 2.5 Default Fallback (Mínima Prioridade)
Se nenhum sinal funcionar, default para Brasil (mercado principal atual).

```ts
return 'BR'
```

---

## 3. Algoritmo Completo de Detecção

```ts
// lib/market/detection.ts

export const MARKETS = {
  BR: { code: 'BR', locale: 'pt-BR', currency: 'BRL', name: 'Brasil', flag: '🇧🇷' },
  MX: { code: 'MX', locale: 'es-MX', currency: 'MXN', name: 'México', flag: '🇲🇽' },
  PT: { code: 'PT', locale: 'pt-PT', currency: 'EUR', name: 'Portugal', flag: '🇵🇹' },
} as const

export type MarketCode = keyof typeof MARKETS

export function detectMarket(request: NextRequest): MarketCode {
  // 1. Cookie (escolha anterior do usuário)
  const cookieMarket = request.cookies.get('muuday_market')?.value?.toUpperCase()
  if (cookieMarket && cookieMarket in MARKETS) {
    return cookieMarket as MarketCode
  }

  // 2. URL parameter
  const urlMarket = request.nextUrl.searchParams.get('market')?.toUpperCase()
  if (urlMarket && urlMarket in MARKETS) {
    return urlMarket as MarketCode
  }

  // 3. Accept-Language
  const acceptLang = request.headers.get('accept-language')
  const languageMarket = detectMarketFromLanguage(acceptLang)
  if (languageMarket) {
    return languageMarket
  }

  // 4. IP Geolocation (fallback)
  const ipCountry = request.headers.get('x-vercel-ip-country')?.toUpperCase()
  const ipMarket = detectMarketFromIP(ipCountry)
  if (ipMarket) {
    return ipMarket
  }

  // 5. Default
  return 'BR'
}
```

---

## 4. UI de Confirmação (Banner)

### Quando mostrar o banner?
Só mostrar quando:
1. O usuário NÃO tem cookie `muuday_market`
2. E detectamos um mercado diferente do que ele está vendo atualmente

### Design do Banner

```tsx
// components/market/MarketDetectionBanner.tsx
'use client'

import { useState, useEffect } from 'react'
import { useMarket } from '@/lib/market/context'
import { MARKETS } from '@/lib/market/detection'

export function MarketDetectionBanner() {
  const { currentMarket, detectedMarket, setMarket, dismissBanner } = useMarket()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Só mostra se detectou algo diferente do atual
    if (detectedMarket && detectedMarket !== currentMarket) {
      setShow(true)
    }
  }, [detectedMarket, currentMarket])

  if (!show) return null

  const detected = MARKETS[detectedMarket]
  const current = MARKETS[currentMarket]

  return (
    <div className="bg-blue-600 text-white px-4 py-3 text-center">
      <span className="text-lg mr-2">{detected.flag}</span>
      <span className="font-medium">
        Parece que você está procurando por especialistas {detected.name.toLowerCase()}.
      </span>
      <div className="mt-2 space-x-3">
        <button
          onClick={() => {
            setMarket(detectedMarket)
            setShow(false)
          }}
          className="bg-white text-blue-600 px-4 py-1.5 rounded-full font-medium hover:bg-blue-50 transition"
        >
          Sim, ir para {detected.name}
        </button>
        <button
          onClick={() => {
            setMarket(currentMarket)
            dismissBanner()
            setShow(false)
          }}
          className="text-blue-100 underline hover:text-white transition"
        >
          Não, continuar em {current.name}
        </button>
        <button
          onClick={() => {
            // Mostra modal com todos os mercados
            openMarketSelector()
          }}
          className="text-blue-100 underline hover:text-white transition"
        >
          Outro país
        </button>
      </div>
    </div>
  )
}
```

### Modal de Seleção de Mercado

```tsx
// components/market/MarketSelectorModal.tsx

const ALL_MARKETS = Object.values(MARKETS)

export function MarketSelectorModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Escolha seu país">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ALL_MARKETS.map(market => (
          <button
            key={market.code}
            onClick={() => {
              setMarket(market.code)
              onClose()
            }}
            className="flex items-center gap-3 p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <span className="text-3xl">{market.flag}</span>
            <div className="text-left">
              <div className="font-semibold">{market.name}</div>
              <div className="text-sm text-gray-500">
                {market.locale === 'pt-BR' && 'Português'}
                {market.locale === 'es-MX' && 'Español'}
                {market.locale === 'pt-PT' && 'Português'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  )
}
```

---

## 5. Implementação no Middleware

```ts
// middleware.ts (futuro — adaptação)

import { NextResponse } from 'next/server'
import { detectMarket, MARKETS } from '@/lib/market/detection'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // ... código existente de CSP, nonce, auth ...

  // Detecção de mercado
  const detectedMarket = detectMarket(request)
  const currentPathMarket = request.nextUrl.pathname.split('/')[1]?.toUpperCase()
  
  // Se estamos em uma página de mercado (/br/, /mx/), não redireciona
  if (currentPathMarket && currentPathMarket in MARKETS) {
    // Apenas garante que o cookie está setado
    response.cookies.set('muuday_market', currentPathMarket, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  }
  
  // Se está na root e não tem cookie, seta cookie e redireciona
  if (request.nextUrl.pathname === '/' && !request.cookies.get('muuday_market')) {
    response.cookies.set('muuday_market', detectedMarket, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    
    // Redireciona para o mercado detectado
    // NOTA: Isso pode ser removido se preferirmos mostrar a página BR na root
    // e deixar o banner sugerir o mercado correto
    // return NextResponse.redirect(new URL(`/${detectedMarket.toLowerCase()}/`, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|api|static|.*\\..*).*)'],
}
```

---

## 6. Estado no Cliente (React Context)

```tsx
// lib/market/context.tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { MARKETS, type MarketCode } from './detection'

interface MarketContextType {
  currentMarket: MarketCode
  detectedMarket: MarketCode | null
  setMarket: (market: MarketCode) => void
  dismissBanner: () => void
  marketConfig: typeof MARKETS[MarketCode]
}

const MarketContext = createContext<MarketContextType | null>(null)

export function MarketProvider({ 
  initialMarket, 
  detectedMarket,
  children 
}: Props) {
  const [currentMarket, setCurrentMarket] = useState<MarketCode>(initialMarket)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const setMarket = useCallback(async (market: MarketCode) => {
    // Set cookie via API
    await fetch('/api/market', {
      method: 'POST',
      body: JSON.stringify({ market }),
    })
    setCurrentMarket(market)
    window.location.reload() // Recarrega para aplicar novo locale/mercado
  }, [])

  return (
    <MarketContext.Provider value={{
      currentMarket,
      detectedMarket: bannerDismissed ? null : detectedMarket,
      setMarket,
      dismissBanner: () => setBannerDismissed(true),
      marketConfig: MARKETS[currentMarket],
    }}>
      {children}
    </MarketContext.Provider>
  )
}

export const useMarket = () => {
  const ctx = useContext(MarketContext)
  if (!ctx) throw new Error('useMarket must be used within MarketProvider')
  return ctx
}
```

### API para setar cookie

```ts
// app/api/market/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { market } = await request.json()
  
  const response = NextResponse.json({ success: true })
  response.cookies.set('muuday_market', market, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  
  return response
}
```

---

## 7. Casos de Uso e Testes

| Cenário | Accept-Language | IP | Cookie | Resultado Esperado |
|---------|----------------|-----|--------|-------------------|
| Brasileiro no Brasil | pt-BR | BR | — | BR, sem banner |
| Brasileiro em Londres | pt-BR | GB | — | BR, sem banner (idioma decide) |
| Mexicano nos EUA | es-MX | US | — | MX, banner sugere MX |
| Mexicano no México | es-MX | MX | — | MX, sem banner |
| Americano curioso | en-US | US | — | BR (default), banner não aparece (IP US não mapeado) |
| Usuário volta após 1 semana | pt-BR | GB | MX | MX (cookie prevalece) |
| Link compartilhado `?market=mx` | pt-BR | BR | — | MX (URL param prevalece) |
| Português em França | pt-PT | FR | — | PT (idioma decide) |

---

## 8. Checklist de Implementação

- [ ] Criar `lib/market/detection.ts` com algoritmo completo
- [ ] Criar `lib/market/context.tsx` (React Context)
- [ ] Criar `components/market/MarketDetectionBanner.tsx`
- [ ] Criar `components/market/MarketSelectorModal.tsx`
- [ ] Criar `app/api/market/route.ts` (API para setar cookie)
- [ ] Adaptar `middleware.ts` para detecção de mercado
- [ ] Adicionar banner ao layout root
- [ ] Testar todos os cenários da tabela acima
- [ ] Adicionar testes E2E (Playwright) para detecção de mercado


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
