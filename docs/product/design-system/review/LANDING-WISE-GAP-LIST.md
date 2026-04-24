# Landing Page — Gap List: O que falta para chegar no Wise.com

> **Data**: 2026-04-19  
> **Status**: Em análise — não aprovado pelo stakeholder  
> **Branch**: `wise-refactor-landing`

---

## 🎯 Resumo do Feedback do Stakeholder

> "Escolha as especialidades nao tem todas as categorias... tem lugares que ainda vejo o verde antigo... precisa de uma imagem encima e ficou faltando os elementos graficos... pense sempre na diferenca de mobile para desktop e ipad... achei que esta bem longe da landing page da Wise.com (varias cores, animacoes, motion, imagens, etc)"

**Traducao**: O que entreguei é uma versão "flat minimal" sem a riqueza visual do Wise. Falta: cores, animações, motion, imagens, elementos gráficos, responsividade refinada.

---

## 📋 Lista Completa do Que Falta

### 1. CORES — Paleta ampliada (não só verde)

| Hoje | Wise usa | O que fazer |
|------|----------|-------------|
| Só verde (`#22c55e`) | Verde + Azul como cor secundária | Adicionar `accent-blue: #2563eb` ou similar para CTAs secundários, links, gráficos |
| Fundo verde-mint (`#f4f8f5`) | Neutros frios (`#f2f4f7`, `#ffffff`) | Mudar `--mu-page-bg` para cinza neutro sem tinte verde |
| Texto em verde escuro (`text-brand-700`) | Texto em neutro/preto | Remover `text-brand-700` de labels estáticos — usar `#1c1917` ou `#374151` |
| Cards com bg verde (`bg-brand-50`) | Cards brancos com borda neutra | Remover tinte verde dos cards de "Como funciona" |
| CTA banner dark green (`bg-brand-700`) | CTA em verde vibrante ou branco | Usar `bg-brand-500` (#22c55e) ou fundo branco com botão verde |

**Arquivos**: `app/globals.css`, `app/page.tsx`, `tailwind.config.ts`

---

### 2. IMAGENS — Hero precisa de imagem real

| Hoje | Wise usa | O que fazer |
|------|----------|-------------|
| Composição CSS geométrica (fraca) | Ilustração vetorial colorida ou imagem real | Criar/baixar ilustração SVG no estilo Wise (personagens, mapa-mundi, conexões) |
| Nenhuma imagem nas seções | Cada seção tem imagem/ilustração à direita ou à esquerda | Adicionar ilustrações nas seções: Features, Como funciona, Categorias |

**Opções para imagens:**
1. **unDraw.co** — ilustrações SVG open-source, pode mudar a cor para brand
2. **Blush.design** — ilustrações customizáveis
3. **Gerar com Midjourney/DALL-E** — prompt: "flat vector illustration, Brazilian professionals connecting via video call, green and blue palette, minimal style, transparent background"
4. **Comprar/commissionar** — mais caro, mas único

**Arquivos**: `public/assets/marketing/landing/`, `app/page.tsx`

---

### 3. CATEGORIAS — Mostrar todas (8) + layout melhor

| Hoje | Problema | O que fazer |
|------|----------|-------------|
| `TOP_CATEGORIES.slice(0, 4)` | Só 4 de 8 categorias aparecem | Mudar para mostrar todas as 8 categorias |
| Grid 2×2 simples | Sem destaque visual | Grid 4×2 no desktop, 2×4 no mobile, com ícones maiores e hover animado |

**Categorias existentes (8):**
1. Saúde Mental e Bem-estar Emocional
2. Saúde, Corpo e Movimento
3. Educação e Desenvolvimento
4. Contabilidade, Impostos e Finanças
5. Direito e Suporte Jurídico *(escondida)*
6. Carreira, Negócios e Desenvolvimento Profissional *(escondida)*
7. Tradução e Suporte Documental *(escondida)*
8. Outro *(escondida)*

**Arquivo**: `app/page.tsx` (linha 86)

---

### 4. ANIMAÇÕES / MOTION

| Elemento | Animação desejada | Biblioteca |
|----------|-------------------|------------|
| Hero headline | Fade-in + slide-up ao carregar | CSS `@keyframes` ou Framer Motion |
| Stats bar | Contador animado (100% → contagem) | CSS `animation` ou JS |
| Feature cards | Stagger reveal no scroll | Framer Motion `whileInView` |
| Como funciona | Cards entram da esquerda/direita alternado | Framer Motion |
| Categorias | Hover scale + border glow | CSS `transition` |
| CTA banner | Pulse sutil no botão primário | CSS `animation` |
| FAQ accordion | Smooth height transition | CSS `grid-template-rows` ou Framer Motion |

**Bibliotecas recomendadas:**
- **Framer Motion** — já é padrão no React, fácil de usar
- **GSAP + ScrollTrigger** — mais controle, mais complexo
- **CSS puro** — suficiente para fade-ins simples

**Arquivo**: `app/page.tsx` (novo: `components/landing/AnimatedSection.tsx`)

---

### 5. RESPONSIVIDADE — Mobile / Tablet / Desktop

| Breakpoint | Problema hoje | O que fazer |
|------------|---------------|-------------|
| **Mobile (< 640px)** | Hero sem imagem, texto muito grande | Reduzir headline para `text-4xl`, esconder composição geométrica, empilhar tudo |
| **Tablet (640–1024px)** | Grid de features fica estranho (2 cols muito largas) | Ajustar padding, talvez 1 col no tablet também |
| **Desktop (> 1024px)** | OK, mas precisa de mais whitespace | Aumentar `gap` entre seções, max-width maior para hero |

**Elementos específicos:**
- Hero: em mobile, imagem/ilustração vai ABAIXO do texto, não ao lado
- Stats: em mobile, empilhar verticalmente com mais padding
- Features: em tablet, 1 coluna com cards maiores
- Categorias: em mobile, scroll horizontal ou 1 coluna

**Arquivo**: `app/page.tsx` (ajustar classes Tailwind)

---

### 6. ELEMENTOS GRÁFICOS — O que está faltando

| Elemento | Onde no Wise | O que adicionar |
|----------|--------------|-----------------|
| **Linhas conectoras curvas** | Entre seções, conectando elementos | SVG paths entre "Como funciona" steps |
| **Círculos decorativos** | Fundo de seções | Círculos grandes, semi-transparentes, posicionados absolutamente |
| **Dots/grid pattern** | Fundo sutil | Pattern de pontos em `brand-100` no fundo da seção de features |
| **Blur shapes** | Hero background | Formas blurradas (green + blue) no fundo da hero |
| **Floating badges** | Ao redor de imagens | Badges com ícones flutuando na ilustração da hero |

---

### 7. HEADER / FOOTER — Ainda no estilo antigo

| Problema | Onde | O que fazer |
|----------|------|-------------|
| Nav links `rounded-full` (pill) | `PublicHeader.tsx:175` | `rounded-md` (8px) |
| Logo com gradiente | `PublicHeader.tsx:197` | Cor sólida `bg-brand-500` |
| Logo com shadow | `PublicHeader.tsx:197` | Remover shadow |
| Selectores `rounded-full` | `PublicHeader.tsx:221,235` | `rounded-md` |
| Mobile hamburger `rounded-full` | `PublicHeader.tsx:304` | `rounded-md` |
| Footer logo com gradiente | `PublicFooter.tsx:11` | Cor sólida |

**Arquivos**: `components/public/PublicHeader.tsx`, `components/public/PublicFooter.tsx`

---

### 8. VERDE ANTIGO — Onde ainda aparece

| Arquivo | Linha | Valor antigo | O que fazer |
|---------|-------|--------------|-------------|
| `lib/email/theme.ts` | 13, 16 | `#1a8a50` | Mudar para `#22c55e` |
| `scripts/ops/update-supabase-templates.ts` | 19, 22 | `#1a8a50` | Mudar para `#22c55e` |

**Nota**: Estes afetam emails e templates de auth — não são visíveis na landing page, mas devem ser atualizados para consistência.

---

### 9. TIPOGRAFIA — Ajustes finos

| Hoje | Wise | O que fazer |
|------|------|-------------|
| Headline `text-5xl/6xl` | Muito maior, mais bold | Testar `text-6xl/7xl` com `font-bold` |
| Labels em `uppercase tracking-[0.18em]` | OK, mas cor errada | Mudar para `text-neutral-500` em vez de `text-brand-700` |
| Body `text-base leading-7` | OK | Manter |
| Stats `font-display text-3xl` | Bem maiores | `text-4xl/5xl` com `font-bold` |

---

### 10. SEÇÃO A SEÇÃO — O que mudar

#### Hero
- [ ] Adicionar ilustração real (SVG ou imagem)
- [ ] Background com blur shapes (verde + azul)
- [ ] Headline maior e mais bold
- [ ] Animação de entrada (fade-up)
- [ ] Em mobile: texto acima, imagem abaixo

#### Stats
- [ ] Contador animado
- [ ] Números maiores e bold
- [ ] Divider sutil entre stats

#### Features
- [ ] Ilustração ao lado (desktop) ou acima (mobile)
- [ ] Cards com hover animado (scale + border)
- [ ] Stagger reveal no scroll
- [ ] Background com dots pattern

#### Como funciona
- [ ] Cards brancos (sem bg verde)
- [ ] Números maiores
- [ ] Linha conectora SVG entre steps
- [ ] Animação de entrada alternada

#### Categorias
- [ ] Mostrar todas as 8 categorias
- [ ] Grid 4 colunas no desktop
- [ ] Ícones maiores
- [ ] Hover com scale e shadow sutil

#### FAQ
- [ ] Animação suave de abrir/fechar
- [ ] Ícone + ou - animado

#### CTA
- [ ] Fundo branco com botão verde grande
- [ ] Ou fundo gradiente verde→azul sutil
- [ ] Animação pulse no botão

---

## 🛠️ Ordem de Execução Recomendada

### Fase 1 — Fundação (quick wins)
1. Corrigir cores (remover tinte verde dos neutros)
2. Corrigir header/footer (pills → sharp)
3. Mostrar todas as 8 categorias
4. Atualizar verde antigo nos emails

### Fase 2 — Conteúdo
5. Adicionar ilustrações/imagens na hero
6. Adicionar imagens nas outras seções
7. Ajustar tipografia (tamanhos, pesos)

### Fase 3 — Motion
8. Animações de scroll (Framer Motion)
9. Hover effects nos cards
10. Animação do FAQ accordion

### Fase 4 — Polimento
11. Responsividade refinada (mobile/tablet)
12. Elementos gráficos decorativos (SVGs)
13. Testes cross-browser

---

## ❓ Perguntas para o Stakeholder

1. **Imagens**: Prefere ilustrações vetoriais (unDraw/style) ou fotos reais de pessoas?
2. **Animações**: Quer começar com CSS simples ou já ir para Framer Motion?
3. **Cores**: O tom de azul seria para links, botões secundários, ou elementos gráficos?
4. **Scope**: Quer que eu faça TUDO de uma vez (fases 1–4) ou prefere aprovar por fase?
5. **Prioridade**: O que é mais importante — imagens, animações, ou cores corretas?


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
