# Recomendação de CMS Headless — Expansão Internacional Muuday

> Data: 2026-04-23  
> Status: Recomendação técnica  
> Escopo: Escolha do CMS para conteúdo por mercado (landing pages, guias, blog, termos legais, FAQ)

---

## 1. Critérios de Avaliação

| Critério | Peso | Motivação |
|----------|------|-----------|
| **Custo inicial** | Alto | Startup, orçamento limitado |
| **Custo em escala** | Alto | Não queremos surpresa de $2k/mês com 10k artigos |
| **i18n nativo** | Alto | Conteúdo por mercado (pt-BR, es-MX, pt-PT) |
| **API para Next.js** | Alto | Integração direta, SSR/SSG |
| **Rich text** | Médio | Guias longos com formatação |
| **Relacionamentos** | Médio | Guias ligados a categorias/profissões |
| **Self-hosting** | Médio | Evitar vendor lock-in |
| **Preview em tempo real** | Médio | Marketing/edicao sem deploy |
| **Colaboração** | Médio | Vários redatores/editores |
| **SEO campos** | Médio | Meta title, description, OG, canonical |

---

## 2. Opções Avaliadas

### 2.1 Sanity (⭐ RECOMENDADO)

**Tipo:** SaaS (cloud), com opção de self-hosting (Enterprise)

**Custo:**
- Free: 3 usuários, 100k API calls/mês, 10GB assets
- Growth: $99/mês (10 usuários, 500k calls, 50GB)
- Enterprise: sob consulta

**i18n:**
- Nativo. Cada documento pode ter múltiplos locales.
- Exemplo:
  ```ts
  {
    _id: 'guide-curp',
    title: { 'pt-BR': 'Como manter CPF', 'es-MX': 'Cómo mantener CURP' },
    content: { 'pt-BR': [...], 'es-MX': [...] }
  }
  ```

**API:**
- GROQ (linguagem de query proprietária, muito poderosa)
- GraphQL opcional
- REST
- Client JS: `@sanity/client`

**Rich text:**
- Portabale Text (formato customizado, renderizável em React)
- Suporta imagens, embeds, links internos

**Pros:**
- ✅ DX excepcional (GROQ é muito rápido de escrever)
- ✅ Preview em tempo real (Live Preview API)
- ✅ i18n nativo e elegante
- ✅ Studio (interface de admin) customizável
- ✅ Imagens com CDN e transformações on-the-fly
- ✅ Comunidade grande (Next.js/Sanity é combo comum)
- ✅ Free tier generoso para começar

**Cons:**
- ❌ GROQ tem curva de aprendizado (mas vale a pena)
- ❌ Self-hosting só no Enterprise
- ❌ SaaS — se a Sanity falhar, fica sem CMS (mas SLA é alto)

**Ideal para:** Times que querem começar rápido, com boa DX, e não querem gerenciar infra.

---

### 2.2 Directus

**Tipo:** Open source, self-hosted (ou cloud pago)

**Custo:**
- Self-hosted: Gratuito (mas você paga servidor)
- Cloud: $25/mês (básico), $60/mês (standard)

**i18n:**
- Nativo. Campos podem ser marcados como "translated".

**API:**
- REST (muito completa)
- GraphQL
- WebSockets (real-time)

**Rich text:**
- WYSIWYG editor (TipTap/Quill)
- Suporta Markdown

**Pros:**
- ✅ 100% open source
- ✅ Self-hosted (controle total)
- ✅ SQL puro (qualquer banco relacional)
- ✅ Muito flexível (pode criar collections, fields, relacionamentos facilmente)
- ✅ Sem vendor lock-in

**Cons:**
- ❌ Precisa hospedar (Vercel não rota Directus — precisa de VPS/Render/Railway)
- ❌ Preview em tempo real requer setup extra
- ❌ Menos integrações prontas com Next.js
- ❌ Curva de aprendizado para não-devs

**Ideal para:** Times técnicos que querem controle total e não se importam em hospedar.

---

### 2.3 Strapi

**Tipo:** Open source, self-hosted (ou cloud pago)

**Custo:**
- Self-hosted: Gratuito
- Cloud: $9/mês (bronze), $29/mês (silver)

**i18n:**
- Plugin oficial. Funciona bem, mas é um plugin (não nativo).

**API:**
- REST
- GraphQL (plugin)

**Pros:**
- ✅ Muito popular, comunidade grande
- ✅ Self-hosted
- ✅ Admin panel bonito e fácil para não-devs
- ✅ Plugin ecosystem

**Cons:**
- ❌ i18n é plugin, não nativo
- ❌ Performance em scale (já teve problemas conhecidos)
- ❌ Precisa hospedar
- ❌ Preview requer plugin/setup extra

**Ideal para:** Times que querem um CMS familiar, com admin panel pronto, e não se importam com self-hosting.

---

### 2.4 Contentful

**Tipo:** SaaS cloud

**Custo:**
- Free: 5 usuários, 25k records, 3 locales
- Basic: $489/mês (5 users, 100k records, 6 locales)
- Premium: $879/mês

**i18n:**
- Nativo, muito bom.

**API:**
- REST
- GraphQL
- Preview API

**Pros:**
- ✅ Enterprise-grade, muito robusto
- ✅ i18n excelente
- ✅ Preview nativo
- ✅ Muitas integrações

**Cons:**
- ❌ **MUITO CARO** para startup ($489/mês mínimo para 6 locales)
- ❌ Vendor lock-in pesado
- ❌ Curva de aprendizado

**Ideal para:** Empresas grandes com orçamento enterprise.

---

### 2.5 Ghost

**Tipo:** Open source, self-hosted (ou cloud pago)

**Custo:**
- Self-hosted: Gratuito (mas paga servidor)
- Cloud: $9/mês (starter), $25/mês (creator)

**i18n:**
- Limitado. Ghost não foi feito para multi-idioma nativo. Existem hacks, mas não é ideal.

**API:**
- REST (Content API)
- Admin API

**Pros:**
- ✅ Focado em publishing/blog
- ✅ Newsletter nativa
- ✅ SEO muito bom
- ✅ Rápido de configurar

**Cons:**
- ❌ **Não é CMS headless genérico** — é um CMS de blog
- ❌ i18n limitado
- ❌ Difícil de adaptar para landing pages dinâmicas
- ❌ Relacionamentos limitados

**Ideal para:** Blog puro, não para o caso de uso da Muuday.

---

### 2.6 Supabase (tabelas custom)

**Tipo:** Já usamos para dados — poderíamos usar para conteúdo também.

**Custo:**
- Já estamos pagando (ou no free tier).

**i18n:**
- Manual. Criar tabelas como `guides`, `guide_translations`.

**API:**
- REST/GraphQL via PostgREST

**Pros:**
- ✅ Zero custo adicional
- ✅ Já integrado no projeto
- ✅ SQL puro

**Cons:**
- ❌ **Sem interface de admin** para redatores (precisaria construir)
- ❌ Sem rich text editor
- ❌ Sem preview
- ❌ Sem versionamento
- ❌ Não é um CMS

**Ideal para:** Se quisermos construir nosso próprio CMS (muito trabalho).

---

## 3. Matriz de Decisão

| Critério | Sanity | Directus | Strapi | Contentful | Ghost | Supabase |
|----------|--------|----------|--------|------------|-------|----------|
| Custo inicial | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Custo escala | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| i18n nativo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| API Next.js | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Rich text | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Preview tempo real | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Self-hosting | ⭐⭐ (enterprise) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| DX (developer exp) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Admin para redatores | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **TOTAL** | **44/45** | **39/45** | **36/45** | **34/45** | **30/45** | **29/45** |

---

## 4. Recomendação Final: Sanity

### Por que Sanity vence:
1. **Melhor custo-benefício para startup:** Free tier generoso, só paga quando crescer.
2. **i18n nativo:** Não precisamos de hacks ou plugins.
3. **GROQ + Next.js:** Combo perfeito. Queries rápidas, tipagem TypeScript automática.
4. **Preview em tempo real:** Redatores veem mudanças sem deploy.
5. **Imagens:** CDN global com transformações (resize, crop, format) automáticas.
6. **Studio customizável:** Podemos criar campos customizados para nosso modelo de negócio.

### Arquitetura proposta com Sanity

```
Sanity Studio (CMS)
  ├── Landing Blocks (schema)
  │   ├── hero (title, subtitle, cta, image, locale, market)
  │   ├── stats (stat[]: value, label, locale, market)
  │   ├── features (feature[]: title, description, icon, locale, market)
  │   ├── testimonials (testimonial[]: name, quote, avatar, locale, market)
  │   ├── faq (question, answer, locale, market, category)
  │   └── cta (title, buttonText, link, locale, market)
  │
  ├── Guides (schema)
  │   ├── title (localized)
  │   ├── slug (localized)
  │   ├── content (localized, portable text)
  │   ├── category (reference to category)
  │   ├── market (BR, MX, PT)
  │   ├── locale (pt-BR, es-MX, pt-PT)
  │   ├── seoTitle, seoDescription, ogImage
  │   ├── publishedAt, updatedAt
  │   └── tags
  │
  ├── Blog Posts (schema)
  │   ├── title (localized)
  │   ├── slug (localized)
  │   ├── content (localized)
  │   ├── author (reference)
  │   ├── market, locale
  │   └── seo fields
  │
  ├── Legal Documents (schema)
  │   ├── type (terms, privacy, cookies, professional-terms)
  │   ├── content (localized, portable text)
  │   ├── locale
  │   ├── version
  │   └── effectiveDate
  │
  └── Categories (schema)
      ├── name (localized)
      ├── slug
      └── description (localized)
```

### Exemplo de fetch no Next.js

```ts
// lib/sanity/client.ts
import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2026-04-23',
  useCdn: process.env.NODE_ENV === 'production',
})

// lib/sanity/queries.ts
export const guidesByMarketQuery = `
  *[_type == "guide" && market == $market && locale == $locale] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    "category": category->name,
    publishedAt,
    "coverImage": coverImage.asset->url
  }
`

// app/(markets)/br/guias/page.tsx
export default async function BrazilGuidesPage() {
  const guides = await sanityClient.fetch(guidesByMarketQuery, {
    market: 'BR',
    locale: 'pt-BR',
  })
  return <GuidesList guides={guides} />
}
```

### Imagens no Sanity

```tsx
// Sanity tem CDN de imagens integrado
// URL: https://cdn.sanity.io/images/PROJECT/DATASET/ASSETID-1200x800.jpg
// Transformações: ?w=800&h=600&fit=crop&auto=format

import imageUrlBuilder from '@sanity/image-url'

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: any) {
  return builder.image(source)
}

// Uso:
<img src={urlFor(guide.coverImage).width(800).height(400).fit('crop').url()} />
```

---

## 5. Plano de Migração para Sanity

### Semana 1: Setup
- [ ] Criar projeto Sanity (gratuito)
- [ ] Definir schemas iniciais (landing blocks, guides, blog, legal)
- [ ] Instalar `@sanity/client` no Next.js
- [ ] Configurar variáveis de ambiente (`SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`)

### Semana 2: Migração de Conteúdo BR
- [ ] Migrar guias de `lib/guides-data.ts` para Sanity
- [ ] Criar landing blocks para Brasil
- [ ] Criar termos legais (versão UK) no Sanity
- [ ] Adaptar `app/page.tsx` para consumir dados do Sanity (com fallback para dados estáticos durante transição)

### Semana 3: Adaptação do Frontend
- [ ] Criar funções de fetch reutilizáveis (`loadGuides`, `loadLandingBlocks`, `loadLegalDocument`)
- [ ] Adaptar componentes para receber dados do Sanity
- [ ] Configurar preview mode para edição em tempo real
- [ ] Testar cache/revalidate (ISR)

### Semana 4: Produção
- [ ] Publicar dataset de produção
- [ ] Desativar dados estáticos (fallback)
- [ ] Treinar redatores no Sanity Studio
- [ ] Documentar processo de publicação

---

## 6. Alternativa: Directus (se quiser self-hosted)

Se em algum momento a preocupação com vendor lock-in ou custo de SaaS se tornar maior que a preocupação com velocidade de implementação, **Directus é a alternativa mais sólida**.

**Setup:**
```yaml
# docker-compose.yml (exemplo)
version: '3'
services:
  directus:
    image: directus/directus:latest
    ports:
      - "8055:8055"
    environment:
      KEY: "..."
      SECRET: "..."
      DB_CLIENT: "pg"
      DB_HOST: "..."
      # ... etc
```

Hospedar no Railway, Render, ou VPS (Hetzner/DigitalOcean).

Custo estimado: $10-30/mês para VPS + banco.

---

## 7. Conclusão

**Sanity é a escolha recomendada.** Oferece o melhor equilíbrio entre:
- Custo zero para começar
- i18n nativo (essencial para nós)
- DX excepcional com Next.js
- Preview em tempo real
- Escalabilidade gradual

**Se quiser self-hosted:** Directus.

**Se orçamento não for problema:** Contentful (mas é overkill e caro demais para estágio atual).
