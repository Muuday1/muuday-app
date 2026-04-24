# Implementação Técnica: Detecção de Mercado + Routing

> Data: 2026-04-23  
> Escopo: Código real de como ficaria a detecção automática e routing no Next.js App Router

---

## Visão Geral da Arquitetura

```
app/
├── page.tsx                      ← Página de detecção (root)
│                                 ← Detecta mercado → redirect /br/ ou /mx/
│
├── (markets)/                    ← Route group (não afeta URL)
│   ├── layout.tsx                ← Layout compartilhado: MarketProvider + Header/Footer
│   │
│   ├── br/                       ← Mercado Brasil
│   │   ├── page.tsx              ← Landing BR (dados do CMS ou br-data.ts)
│   │   ├── buscar/
│   │   │   └── page.tsx          ← Busca filtrada por market_code = 'BR'
│   │   ├── guias/
│   │   │   └── page.tsx          ← Guias BR do CMS
│   │   └── registrar-profissional/
│   │       └── page.tsx          ← Onboarding profissional BR
│   │
│   └── mx/                       ← Mercado México (placeholder por enquanto)
│       └── page.tsx              ← Landing MX (404 ou "Em breve" até lançar)
│
├── api/
│   └── market/
│       └── route.ts              ← API para setar cookie muuday_market
│
└── layout.tsx                    ← Root layout (lang="pt-BR" por enquanto)
```

> **Nota:** O `(markets)` é um Route Group do Next.js. Ele agrupa rotas sem afetar a URL. `/br/` e `/mx/` continuam acessíveis normalmente.

---

## 1. Algoritmo de Detecção (`lib/market/detection.ts`)

```ts
// lib/market/detection.ts

import { NextRequest } from 'next/server'

export const MARKETS = {
  BR: {
    code: 'BR',
    locale: 'pt-BR',
    currency: 'BRL',
    name: 'Brasil',
    flag: '🇧🇷',
    domain: 'muuday.com',
  },
  MX: {
    code: 'MX',
    locale: 'es-MX',
    currency: 'MXN',
    name: 'México',
    flag: '🇲🇽',
    domain: 'muuday.com',
  },
  PT: {
    code: 'PT',
    locale: 'pt-PT',
    currency: 'EUR',
    name: 'Portugal',
    flag: '🇵🇹',
    domain: 'muuday.com',
  },
} as const

export type MarketCode = keyof typeof MARKETS

/**
 * Detecta o mercado preferido do usuário baseado em múltiplos sinais.
 * Prioridade:
 * 1. Cookie persistido (escolha anterior do usuário)
 * 2. Parâmetro de URL (?market=mx)
 * 3. Accept-Language do browser (melhor indicador de "de onde a pessoa é")
 * 4. IP Geolocation (fallback)
 * 5. Default: BR
 */
export function detectMarket(request: NextRequest): MarketCode {
  // 1. Cookie (MÁXIMA prioridade — respeita escolha do usuário)
  const cookieMarket = request.cookies.get('muuday_market')?.value?.toUpperCase()
  if (cookieMarket && cookieMarket in MARKETS) {
    return cookieMarket as MarketCode
  }

  // 2. Parâmetro de URL
  const urlMarket = request.nextUrl.searchParams.get('market')?.toUpperCase()
  if (urlMarket && urlMarket in MARKETS) {
    return urlMarket as MarketCode
  }

  // 3. Accept-Language (melhor que IP para expats)
  const acceptLang = request.headers.get('accept-language')
  const languageMarket = detectFromLanguage(acceptLang)
  if (languageMarket) {
    return languageMarket
  }

  // 4. IP Geolocation (fallback)
  const ipCountry = request.headers.get('x-vercel-ip-country')?.toUpperCase()
    || request.headers.get('cf-ipcountry')?.toUpperCase()
  if (ipCountry && ipCountry in MARKETS) {
    return ipCountry as MarketCode
  }

  // 5. Default
  return 'BR'
}

function detectFromLanguage(acceptLang: string | null): MarketCode | null {
  if (!acceptLang) return null

  // Parse accept-language: "es-MX,es;q=0.9,pt-BR;q=0.8,en;q=0.7"
  const languages = acceptLang
    .split(',')
    .map(lang => {
      const [code, qPart] = lang.trim().split(';q=')
      const q = qPart ? parseFloat(qPart) : 1.0
      return { code: code.trim().toLowerCase(), q }
    })
    .sort((a, b) => b.q - a.q) // Ordena por qualidade (q-value)

  for (const { code } of languages) {
    // Espanhol mexicano ou genérico
    if (code === 'es-mx' || code === 'es') {
      return 'MX'
    }

    // Português brasileiro
    if (code === 'pt-br') {
      return 'BR'
    }

    // Português europeu
    if (code === 'pt-pt' || code === 'pt') {
      return 'PT'
    }
  }

  return null
}

/**
 * Pega o mercado atual da URL (ex: /br/ → "BR", /mx/ → "MX")
 */
export function getMarketFromPathname(pathname: string): MarketCode | null {
  const firstSegment = pathname.split('/')[1]?.toUpperCase()
  if (firstSegment && firstSegment in MARKETS) {
    return firstSegment as MarketCode
  }
  return null
}

/**
 * Cookie config para muuday_market
 */
export const MARKET_COOKIE = {
  name: 'muuday_market',
  maxAge: 60 * 60 * 24 * 365, // 1 ano
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}
```

---

## 2. Middleware Atualizado (`middleware.ts`)

```ts
// middleware.ts

import { NextResponse } from 'next/server'
import { detectMarket, getMarketFromPathname, MARKET_COOKIE, MARKETS } from '@/lib/market/detection'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // ===== CÓDIGO EXISTENTE (CSP, nonce, auth) =====
  // ... manter todo o código atual de CSP, nonce, auth ...
  // ================================================

  const pathname = request.nextUrl.pathname

  // Ignora rotas que não são de mercado (API, static, _next, etc.)
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return response
  }

  // Detecta mercado do usuário
  const detectedMarket = detectMarket(request)

  // Pega mercado da URL atual (ex: /br/ → "BR")
  const urlMarket = getMarketFromPathname(pathname)

  // Se está em uma página de mercado (/br/, /mx/)
  if (urlMarket) {
    // Garante que o cookie está setado com o mercado da URL
    // (se o usuário escolheu manualmente ou acessou link direto)
    response.cookies.set(MARKET_COOKIE.name, urlMarket, {
      maxAge: MARKET_COOKIE.maxAge,
      path: MARKET_COOKIE.path,
      sameSite: MARKET_COOKIE.sameSite,
      secure: MARKET_COOKIE.secure,
    })

    // Se o cookie diz um mercado DIFERENTE da URL, não forçamos redirect.
    // O banner de confirmação no client-side vai sugerir a mudança.
    // Isso evita loops de redirect e respeita a escolha do usuário.
    return response
  }

  // Se está na root (/) e não tem cookie de mercado, redireciona para o detectado
  if (pathname === '/' && !request.cookies.get('muuday_market')) {
    const marketPath = `/${detectedMarket.toLowerCase()}/`
    return NextResponse.redirect(new URL(marketPath, request.url))
  }

  // Se está na root e TEM cookie, redireciona para o cookie
  if (pathname === '/' && request.cookies.get('muuday_market')) {
    const cookieMarket = request.cookies.get('muuday_market')!.value.toUpperCase()
    if (cookieMarket in MARKETS) {
      return NextResponse.redirect(new URL(`/${cookieMarket.toLowerCase()}/`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

> **Por que não redirecionamos automaticamente de /br/ para /mx/?**
> Se o usuário acessou `/br/` explicitamente (link compartilhado, bookmark), respeitamos. O banner no client-side sugere o mercado correto se detectado for diferente.

---

## 3. Página Root — Detecção (`app/page.tsx`)

```tsx
// app/page.tsx
// Esta página só é acessada quando o middleware NÃO redirecionou.
// Isso acontece se:
// - O usuário desativou cookies
// - O middleware falhou
// - Acessou diretamente com query param específico

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { detectMarket, MARKETS, type MarketCode } from '@/lib/market/detection'
import { MarketSelector } from '@/components/market/MarketSelector'

export default function RootPage() {
  // Se não conseguimos detectar ou não temos certeza, mostra seletor
  // Na prática, o middleware já redirecionou. Essa página é fallback.

  const headersList = headers()
  const acceptLang = headersList.get('accept-language') || ''
  const ipCountry = headersList.get('x-vercel-ip-country') || ''

  // Mock request para usar a função de detecção
  const mockRequest = {
    cookies: { get: () => undefined },
    nextUrl: { searchParams: new URLSearchParams() },
    headers: new Headers({
      'accept-language': acceptLang,
      'x-vercel-ip-country': ipCountry,
    }),
  } as any

  const detectedMarket = detectMarket(mockRequest)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <MarketSelector detectedMarket={detectedMarket} />
    </div>
  )
}
```

---

## 4. Seletor de Mercado (`components/market/MarketSelector.tsx`)

```tsx
// components/market/MarketSelector.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MARKETS, type MarketCode } from '@/lib/market/detection'

interface Props {
  detectedMarket: MarketCode
}

export function MarketSelector({ detectedMarket }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<MarketCode | null>(null)

  const handleSelectMarket = async (market: MarketCode) => {
    setIsLoading(market)

    // Chama API para setar cookie
    await fetch('/api/market', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market }),
    })

    // Redirect para o mercado escolhido
    router.push(`/${market.toLowerCase()}/`)
    router.refresh()
  }

  const allMarkets = Object.values(MARKETS)

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Bem-vindo à Muuday
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Escolha seu país para encontrar especialistas da sua comunidade
      </p>

      {/* Sugestão automática */}
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-3">
          Detectamos que você pode estar procurando por:
        </p>
        <button
          onClick={() => handleSelectMarket(detectedMarket)}
          disabled={isLoading !== null}
          className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          <span className="text-2xl">{MARKETS[detectedMarket].flag}</span>
          <span>
            {MARKETS[detectedMarket].name}
            {isLoading === detectedMarket && ' ...'}
          </span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-500">ou escolha outro</span>
        </div>
      </div>

      {/* Grid de todos os mercados */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {allMarkets.map((market) => (
          <button
            key={market.code}
            onClick={() => handleSelectMarket(market.code)}
            disabled={isLoading !== null}
            className={`
              flex items-center gap-3 p-4 border-2 rounded-xl transition
              ${market.code === detectedMarket
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }
              disabled:opacity-50
            `}
          >
            <span className="text-3xl">{market.flag}</span>
            <div className="text-left">
              <div className="font-semibold text-gray-900">{market.name}</div>
              <div className="text-sm text-gray-500">
                {market.locale === 'pt-BR' && 'Português'}
                {market.locale === 'es-MX' && 'Español'}
                {market.locale === 'pt-PT' && 'Português'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## 5. Layout Compartilhado por Mercado (`app/(markets)/layout.tsx`)

```tsx
// app/(markets)/layout.tsx

import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { MARKETS, getMarketFromPathname, detectMarket, type MarketCode } from '@/lib/market/detection'
import { MarketProvider } from '@/components/market/MarketProvider'
import { MarketDetectionBanner } from '@/components/market/MarketDetectionBanner'

interface Props {
  children: React.ReactNode
}

export default async function MarketsLayout({ children }: Props) {
  // Pega o pathname do header (não temos acesso a request no layout do App Router)
  const headersList = headers()
  const pathname = headersList.get('x-invoke-path') || headersList.get('x-matched-path') || ''

  // Extrai mercado da URL
  const marketCode = getMarketFromPathname(pathname)

  if (!marketCode || !(marketCode in MARKETS)) {
    notFound()
  }

  // Detecta o mercado "real" do usuário (para o banner)
  const acceptLang = headersList.get('accept-language') || ''
  const ipCountry = headersList.get('x-vercel-ip-country') || ''

  const mockRequest = {
    cookies: { get: (name: string) => {
      const cookieHeader = headersList.get('cookie') || ''
      const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`))
      return match ? { value: match[1] } : undefined
    }},
    nextUrl: { searchParams: new URLSearchParams() },
    headers: new Headers({
      'accept-language': acceptLang,
      'x-vercel-ip-country': ipCountry,
    }),
  } as any

  const detectedMarket = detectMarket(mockRequest)

  return (
    <MarketProvider
      currentMarket={marketCode}
      detectedMarket={detectedMarket}
    >
      <MarketDetectionBanner />
      {children}
    </MarketProvider>
  )
}
```

---

## 6. React Context de Mercado (`components/market/MarketProvider.tsx`)

```tsx
// components/market/MarketProvider.tsx
'use client'

import { createContext, useContext, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MARKETS, type MarketCode } from '@/lib/market/detection'

interface MarketContextType {
  currentMarket: MarketCode
  detectedMarket: MarketCode | null
  marketConfig: typeof MARKETS[MarketCode]
  setMarket: (market: MarketCode) => Promise<void>
}

const MarketContext = createContext<MarketContextType | null>(null)

interface Props {
  children: React.ReactNode
  currentMarket: MarketCode
  detectedMarket: MarketCode | null
}

export function MarketProvider({ children, currentMarket, detectedMarket }: Props) {
  const router = useRouter()

  const setMarket = useCallback(async (market: MarketCode) => {
    await fetch('/api/market', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market }),
    })

    router.push(`/${market.toLowerCase()}/`)
    router.refresh()
  }, [router])

  return (
    <MarketContext.Provider
      value={{
        currentMarket,
        detectedMarket,
        marketConfig: MARKETS[currentMarket],
        setMarket,
      }}
    >
      {children}
    </MarketContext.Provider>
  )
}

export function useMarket() {
  const ctx = useContext(MarketContext)
  if (!ctx) {
    throw new Error('useMarket must be used within MarketProvider')
  }
  return ctx
}
```

---

## 7. Banner de Confirmação (`components/market/MarketDetectionBanner.tsx`)

```tsx
// components/market/MarketDetectionBanner.tsx
'use client'

import { useState } from 'react'
import { useMarket } from './MarketProvider'
import { MARKETS } from '@/lib/market/detection'

export function MarketDetectionBanner() {
  const { currentMarket, detectedMarket, setMarket } = useMarket()
  const [dismissed, setDismissed] = useState(false)

  // Não mostra se:
  // - Não detectou nada
  // - Detectou o mesmo mercado atual
  // - Usuário dismissou
  if (!detectedMarket || detectedMarket === currentMarket || dismissed) {
    return null
  }

  const detected = MARKETS[detectedMarket]
  const current = MARKETS[currentMarket]

  return (
    <div className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{detected.flag}</span>
          <span>
            Você está vendo <strong>{current.name}</strong>.
            Parece que você está procurando por especialistas{' '}
            <strong>{detected.name}</strong>?
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMarket(detectedMarket)}
            className="px-4 py-1.5 bg-white text-blue-700 text-sm font-medium rounded-full hover:bg-blue-50 transition"
          >
            Ir para {detected.name}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 text-blue-100 text-sm hover:text-white transition"
          >
            Não, obrigado
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 8. API para Setar Cookie (`app/api/market/route.ts`)

```ts
// app/api/market/route.ts

import { NextResponse } from 'next/server'
import { MARKET_COOKIE, MARKETS, type MarketCode } from '@/lib/market/detection'

export async function POST(request: Request) {
  try {
    const { market } = await request.json()
    const marketCode = String(market).toUpperCase()

    if (!(marketCode in MARKETS)) {
      return NextResponse.json(
        { error: 'Invalid market code' },
        { status: 400 }
      )
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set(MARKET_COOKIE.name, marketCode, {
      maxAge: MARKET_COOKIE.maxAge,
      path: MARKET_COOKIE.path,
      sameSite: MARKET_COOKIE.sameSite,
      secure: MARKET_COOKIE.secure,
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
```

---

## 9. Como Usar o Mercado nos Componentes

```tsx
// Exemplo: Landing page do Brasil
// app/(markets)/br/page.tsx

import { loadLandingData } from '@/lib/market/landing-loader'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function BrazilLandingPage() {
  // Por enquanto, dados estáticos. Futuramente: CMS
  const data = await loadLandingData('BR')

  return <LandingPage data={data} />
}
```

```tsx
// Exemplo: Busca com filtro por mercado
// app/(markets)/br/buscar/page.tsx

import { loadPublicSearchBaseData } from '@/lib/actions/search'

export default async function BrazilSearchPage() {
  // Passa 'BR' para filtrar só profissionais brasileiros
  const professionals = await loadPublicSearchBaseData({ market: 'BR' })

  return <SearchPage professionals={professionals} />
}
```

```tsx
// Exemplo: Componente que precisa saber o mercado atual
// components/professional/PricingDisplay.tsx
'use client'

import { useMarket } from '@/components/market/MarketProvider'

export function PricingDisplay({ amount }: { amount: number }) {
  const { marketConfig } = useMarket()

  return (
    <span>
      {new Intl.NumberFormat(marketConfig.locale, {
        style: 'currency',
        currency: marketConfig.currency,
      }).format(amount / 100)}
    </span>
  )
}

// Uso:
// Brasil:  "R$ 200,00"
// México:  "$1,500.00"
// Portugal: "€50,00"
```

---

## 10. Fluxo Completo do Usuário

### Cenário 1: Brasileiro no Brasil (primeira visita)
```
1. Acessa muuday.com/
2. Middleware detecta: Accept-Language=pt-BR, IP=BR
3. Redirect automático para muuday.com/br/
4. Cookie muuday_market=BR é setado
5. Próxima visita: vai direto para /br/ (cookie prevalece)
```

### Cenário 2: Mexicano nos EUA (primeira visita)
```
1. Acessa muuday.com/
2. Middleware detecta: Accept-Language=es-MX, IP=US
3. Detecta MX pelo Accept-Language (IP US não mapeia)
4. Redirect para muuday.com/mx/
5. Banner não aparece (detectado = atual = MX)
```

### Cenário 3: Brasileiro em Londres (primeira visita)
```
1. Acessa muuday.com/
2. Middleware detecta: Accept-Language=pt-BR, IP=GB
3. Detecta BR pelo Accept-Language (ignora IP GB)
4. Redirect para muuday.com/br/
5. Banner não aparece (detectado = atual = BR)
```

### Cenário 4: Mexicano em Londres, mas quer ver Brasil
```
1. Acessa muuday.com/mx/ (ou foi redirecionado)
2. Cookie muuday_market=MX
3. Mas o amigo mandou link muuday.com/br/
4. Acessa /br/ → vê site brasileiro
5. Banner aparece: "Você está vendo Brasil. Parece que você está procurando México? [Ir para México] [Não, obrigado]"
6. Se clicar "Não, obrigado": cookie continua MX, mas está navegando no BR
```

### Cenário 5: Link compartilhado
```
1. Amigo brasileiro manda link: muuday.com/br/profissional/fulano
2. Mexicano abre o link
3. Vê perfil do profissional brasileiro (respeitamos o link!)
4. Banner aparece sugerindo México
```

---

## 11. O Que NÃO Fazemos (e Por Quê)

| Abordagem | Por que não usamos |
|-----------|-------------------|
| **Redirect forçado de /br/ para /mx/** se detectar MX | Respeitamos o link/bookmark do usuário. O banner sugere, não impõe. |
| **Subdomínios (br.muuday.com)** | Mais complexo de gerenciar, dilui SEO authority. |
| **Locale prefix em todas as URLs (/br/pt-BR/)** | Overkill. Um mercado = um idioma (por enquanto). |
| **Auto-detect baseado só em IP** | IP é onde a pessoa ESTÁ, não de onde É. Brasileiro em Londres seria mandado para UK. |
| **Geo-blocking** | Não bloqueamos ninguém. Só sugerimos o mercado correto. |

---

## Checklist de Implementação

- [ ] Criar `lib/market/detection.ts`
- [ ] Criar `lib/market/landing-loader.ts` (wrapper para carregar dados por mercado)
- [ ] Adaptar `middleware.ts` para detectar e redirecionar
- [ ] Criar `app/(markets)/layout.tsx`
- [ ] Mover `app/page.tsx` → `app/(markets)/br/page.tsx`
- [ ] Criar `app/(markets)/mx/page.tsx` (placeholder)
- [ ] Criar `components/market/MarketProvider.tsx`
- [ ] Criar `components/market/MarketSelector.tsx`
- [ ] Criar `components/market/MarketDetectionBanner.tsx`
- [ ] Criar `app/api/market/route.ts`
- [ ] Adaptar `app/buscar/page.tsx` para aceitar `market` param
- [ ] Testar todos os cenários acima


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
