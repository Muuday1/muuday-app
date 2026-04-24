# Especificacao: Deteccao e Routing de Mercado - Versao 2 (Sofisticada)

> Data: 2026-04-23
> Status: Especificacao de produto
> Principio: A escolha de mercado e uma decisao do usuario, nao da maquina. A maquina sugere; o usuario decide.

---

## 1. FILOSOFIA CENTRAL

### O Problema

O usuario da Muuday e um expatriado - alguem que mora fora do pais de origem. Isso quebra todas as heuristicas tradicionais de geolocalizacao.

**Conclusao:** Nao existe um sinal unico confiavel. Precisamos de um sistema de inferencia probabilistica combinando multiplos sinais, com fallback para escolha explicita.

### Principios de Design

1. **Respeito a Escolha:** Se o usuario ja escolheu um mercado, nunca o substituimos automaticamente.
2. **Sugestao, Nao Imposicao:** Detectamos, sugerimos, mas nao redirecionamos forcado.
3. **Linguagem Contextual:** A interface se adapta ao contexto de comunicacao, nao apenas ao mercado.
4. **Escalabilidade:** O sistema deve suportar N mercados sem mudanca de arquitetura.
5. **Transparencia:** O usuario sempre entende por que estamos sugerindo algo.

---

## 2. MODELO DE SINAIS (Signal Model)

### 2.1 Sinais Primarios (Alta Confianca)

| Sinal | Peso | Confianca | Explicacao |
|-------|------|-----------|------------|
| Cookie Persistente | 100 | 100% | O usuario ja escolheu antes |
| Autenticacao (User ID) | 100 | 100% | profiles.country + profiles.language |
| URL Explicita | 90 | 95% | /mx/ na URL e intencao clara |

### 2.2 Sinais Secundarios (Media Confianca)

| Sinal | Peso | Confianca | Explicacao |
|-------|------|-----------|------------|
| Accept-Language primario | 70 | 75% | es-MX -> provavelmente Mexico |
| Accept-Language secundario | 40 | 50% | pt-BR como segunda opcao sugere brasileiro |
| Historico de Navegacao | 60 | 60% | Visitou /br/ 5x -> e brasileiro |
| Referrer | 30 | 40% | Link de grupo BR -> provavelmente BR |

### 2.3 Sinais Terciarios (Baixa Confianca)

| Sinal | Peso | Confianca | Explicacao |
|-------|------|-----------|------------|
| IP Geolocation | 20 | 30% | Brasileiro em Londres -> IP UK = errado |
| Timezone do dispositivo | 25 | 35% | Pode estar viajando |

### 2.4 Sinais Negativos (Reduzem Confianca)

| Sinal | Efeito |
|-------|--------|
| VPN detectado | Reduz confianca do IP para 0 |
| Modo anonimo | Reduz confianca do historico |
| Tor Browser | Ignora todos os sinais -> mostra seletor |

---

## 3. ALGORITMO DE INFERENCIA

### 3.1 Matriz de Decisao

Para cada mercado, calculamos um score ponderado:

```
score[m] = soma de (peso_sinal * confianca_sinal) para todos os sinais que apontam para m

M_sugestao = mercado com maior score
confianca_total = score[M_sugestao] / soma de todos os scores

SE confianca_total < 0.5: mostrar seletor completo
SENAO: mostrar banner sugestivo
```

### 3.2 Exemplos

**Exemplo 1: Brasileiro em Londres (primeira visita)**
- Cookie: ausente
- Accept-Language: pt-BR,en -> BR (peso 70, conf 75%)
- IP: GB -> ignorado
- Score BR: 52.5 | Score MX: 0 | Score PT: 0
- Resultado: Sugere BR

**Exemplo 2: Mexicano em Nova York (primeira visita)**
- Cookie: ausente
- Accept-Language: es-MX,es,en -> MX (peso 70, conf 75%)
- IP: US -> ignorado
- Score MX: 52.5 | Score BR: 0 | Score PT: 0
- Resultado: Sugere MX

**Exemplo 3: Brasileiro em Portugal (usou VPN US)**
- Cookie: ausente
- Accept-Language: pt-BR,pt -> BR (peso 70, conf 75%), PT (peso 40, conf 50%)
- IP: US -> VPN detectada, ignorado
- Score BR: 52.5 | Score PT: 20 | Score MX: 0
- Resultado: Sugere BR (mas com menos confianca)

**Exemplo 4: Turista americano curioso (sem sinais)**
- Cookie: ausente
- Accept-Language: en-US,en -> nenhum mapeamento
- IP: US -> nenhum mapeamento
- Scores: todos zero
- Resultado: Seletor completo (sem sugestao)

**Exemplo 5: Usuario logado (brasileiro)**
- Cookie: BR
- User auth: country=BR, language=pt-BR
- Score BR: 100 + 100 = 200
- Resultado: BR com 100% confianca, sem banner

---

## 4. ESTRATEGIA DE IDIOMA DO BANNER

### 4.1 O Desafio

Quando sugerimos uma mudanca de mercado, em que idioma mostramos o banner?

**Cenario:** Um mexicano esta navegando no site brasileiro (/br/).
- O site esta em portugues.
- Detectamos que ele e mexicano.
- O banner diz... o que? Em que idioma?

### 4.2 Regra de Ouro

> O banner deve ser comunicado no idioma que maximiza a compreensao do usuario, considerando que ele pode estar em um mercado estranho por acidente.

### 4.3 Matriz de Idioma do Banner

| Mercado Atual | Mercado Detectado | Idioma do Banner | Justificativa |
|---------------|-------------------|------------------|---------------|
| BR (pt-BR) | MX | Espanhol (es-MX) | O mexicano provavelmente nao le portugues bem |
| BR (pt-BR) | PT | Portugues (pt-PT) | O portugues entende portugues do Brasil |
| MX (es-MX) | BR | Portugues (pt-BR) | O brasileiro provavelmente nao le espanhol bem |
| MX (es-MX) | PT | Portugues (pt-PT) ou Espanhol | Ambos sao linguas romanicas, pt-PT e mais proximo |
| PT (pt-PT) | BR | Portugues (pt-BR) | Mutuamente inteligivel |
| PT (pt-PT) | MX | Espanhol (es-MX) | Mais proximo do pt-PT que o portugues do Brasil |
| Qualquer | Qualquer | Ingles (fallback) | Se nao houver overlap de idioma |

### 4.4 Logica de Idioma do Banner

```
idioma_banner =
  SE mercado_detectado.language == mercado_atual.language:
    mercado_atual.language  (ex: pt-BR -> pt-BR)
  SENAO SE mercado_detectado e mercado_atual sao linguas irmas (romanicas):
    mercado_detectado.language  (falar no idioma do usuario)
  SENAO:
    "detected_language + atual_language + ingles"  (banner trilingue)
```

### 4.5 Exemplos de Banner por Contexto

**Mexicano no site do Brasil:**
```
🇲🇽 Parece que eres de México. ¿Quieres ver especialistas mexicanos?
    [Sí, ir a México]  [No, quedarme en Brasil]
    
(Legenda pequena: "Parece que voce e do Mexico. Quer ver especialistas
mexicanos?" em portugues, caso ele entenda)
```

**Brasileiro no site do Mexico:**
```
🇧🇷 Parece que voce e do Brasil. Quer ver especialistas brasileiros?
    [Sim, ir para o Brasil]  [Nao, ficar no Mexico]
    
(Legenda pequena: "Parece que eres de Brasil. Quieres ver especialistas
brasileños?" em espanhol)
```

**Turista americano (sem deteccao clara):**
```
🇧🇷 Brazil (Portuguese)    🇲🇽 Mexico (Spanish)    🇵🇹 Portugal (Portuguese)

(Em ingles:) "Choose your community to find professionals from your home country"
```

### 4.6 Banner Bilingue (Opcao Recomendada)

Para mercados com alta sobreposicao linguistica (BR/PT/MX), o banner pode ser bilingue:

```
┌────────────────────────────────────────────────────────────────────┐
│  🇲🇽  Parece que voce e do México / Parece que eres de México      │
│                                                                  │
│       [Sim, ir para Mexico]  [Sí, ir a Mexico]                  │
│       [Nao, ficar no Brasil] [No, quedarme en Brasil]           │
└────────────────────────────────────────────────────────────────────┘
```

Isso maximiza a chance de compreensao sem depender de um unico idioma.

---

## 5. COMPONENTE DE SELECAO (Dropdown Escalavel)

### 5.1 Por que Dropdown?

- Podemos adicionar 5, 10, 20 paises sem mudar o design.
- Nao precisamos de grid que quebra em mobile.
- Familiar (padrao de todas as plataformas globais: Amazon, Netflix, Spotify).

### 5.2 Estados do Componente

```
[🌐 Brasil ▼]  <- Dropdown fechado (mostra mercado atual)

[🌐 Selecione seu pais ▼]  <- Dropdown fechado (sem mercado selecionado)

┌─────────────────────────────┐
│ 🌎 Americas                 │
│   🇧🇷 Brasil (Portugues)     │
│   🇲🇽 Mexico (Espanol)       │
│   🇺🇸 Estados Unidos         │
│                             │
│ 🌍 Europa                   │
│   🇵🇹 Portugal (Portugues)   │
│   🇪🇸 Espanha (Espanol)      │
│   🇬🇧 Reino Unido (Ingles)   │
│                             │
│ 🌏 Asia-Pacifico            │
│   🇯🇵 Japao (Japones)        │
└─────────────────────────────┘
```

### 5.3 Organizacao do Dropdown

- **Agrupado por continente** (Americas, Europa, Asia) para escanabilidade.
- **Mercados ativos primeiro** (BR, MX) com badge "Disponivel".
- **Mercados em breve** (PT, ES) com badge "Em breve" ou desabilitado.
- **Busca por texto** dentro do dropdown (digita "bra" -> filtra Brasil).

### 5.4 Posicao do Seletor

O seletor de mercado deve estar:
- **No header de todas as paginas** (lado direito, proximo ao idioma/login).
- **Persistente:** O usuario pode mudar de mercado a qualquer momento.
- **Nao intrusivo:** Um simples dropdown, nao um modal que bloqueia.

```
[Logo Muuday]    [Buscar]    [Profissionais]    [Guias]    [Ajuda]
                                                    [🌐 Brasil ▼]  [Entrar]
```

---

## 6. PERSISTENCIA E MUDANCA DE MERCADO

### 6.1 Niveis de Persistencia

| Nivel | Duracao | Quando Usado |
|-------|---------|--------------|
| Sessao (sessionStorage) | Aba atual | Navegacao entre paginas do mesmo mercado |
| Curto prazo (localStorage) | 7 dias | Lembrar escolha por uma semana |
| Longo prazo (Cookie) | 1 ano | Escolha definitiva do usuario |
| Conta (DB) | Permanente | Usuario logado: profiles.market_code |

### 6.2 Hierarquia de Persistencia

```
1. DB (usuario logado) -> profiles.market_code
2. Cookie (1 ano) -> muuday_market
3. localStorage (7 dias) -> muuday_market_temp
4. Sessao -> sessionStorage
5. Inferencia -> detectMarket()
```

### 6.3 Mudanca de Mercado

Quando o usuario muda de mercado via dropdown:

```
1. Atualiza cookie muuday_market (1 ano)
2. Atualiza localStorage (7 dias)
3. Se logado: atualiza profiles.market_code via API
4. Redireciona para o novo mercado (ex: /mx/)
5. Recarrega a pagina
```

### 6.4 Sincronizacao Entre Dispositivos

- Cookie e sincronizado entre abas do mesmo navegador automaticamente.
- Se o usuario muda no mobile, nao muda no desktop (limitacao de cookies).
- Se logado: DB sincroniza entre todos os dispositivos (profiles.market_code).

---

## 7. COMPORTAMENTO POR TIPO DE USUARIO

### 7.1 Primeira Visita (New User)

```
1. Acessa muuday.com/
2. Sistema detecta mercado (inferencia probabilistica)
3. SE confianca > 70%:
     - Redireciona para /br/ (ou /mx/)
     - NAO mostra banner (ja esta no mercado certo)
4. SE confianca entre 50-70%:
     - Redireciona para o detectado
     - Mostra banner sutil: "Detectamos que voce pode ser do Mexico. Correto?"
5. SE confianca < 50%:
     - NAO redireciona
     - Mostra pagina de selecao completa com todos os mercados
```

### 7.2 Visita Recorrente (Returning User)

```
1. Acessa muuday.com/
2. Le cookie muuday_market = MX
3. Redireciona para /mx/
4. NAO mostra banner (respeita escolha anterior)
```

### 7.3 Usuario Logado

```
1. profiles.market_code = 'BR'
2. Qualquer acesso redireciona para /br/
3. Cookie sincronizado com DB
4. Usuario pode mudar via dropdown -> atualiza DB
```

### 7.4 Link Compartilhado

```
1. Amigo manda: muuday.com/br/profissional/dra-ana
2. Sistema detecta que o visitante e mexicano
3. NAO redireciona fora do link!
4. Mostra banner: "Este e um profissional brasileiro. Voce esta procurando especialistas mexicanos?"
5. Usuario escolhe: continua vendo Dra. Ana (BR) ou vai para MX
```

---

## 8. EDGE CASES E COMPORTAMENTOS ESPECIAIS

### 8.1 VPN / Proxy

```
Sinais:
  - IP: US (mas Accept-Language: pt-BR)
  - Timezone: America/Sao_Paulo
  
Deteccao:
  - Flag "possivel VPN" = true
  - Reduz peso do IP para 0
  - Aumenta peso do Accept-Language para 90
  - Mostra banner com mais enfase: "Detectamos inconsistencia. Confirme seu pais."
```

### 8.2 Navegacao em Modo Anonimo

```
- Sem cookies persistentes
- Sem localStorage
- Sistema usa apenas sinais da sessao atual
- SE detecta com confianca > 70%: redireciona
- SENAO: mostra seletor
- NAO mostra banner em modo anonimo (evita spam)
```

### 8.3 Multiplos Idiomas no Browser

```
Accept-Language: "pt-BR,es-MX,en-US"

Interpretacao:
  - Primario: pt-BR -> BR (peso 70)
  - Secundario: es-MX -> MX (peso 40)
  
Score: BR=70, MX=40
Resultado: Sugere BR, mas com menor confianca
Banner: "Parece que voce e do Brasil. Tambem detectamos interesse no Mexico. Correto?"
```

### 8.4 Bot / Crawler (Google, Facebook, etc.)

```
User-Agent: "Googlebot/2.1"

Comportamento:
  - NAO redireciona (evita confusao de indexacao)
  - NAO seta cookie
  - Mostra versao default (BR) na root
  - Permite crawling de /br/ e /mx/ normalmente
  - hreflang tags guiam o SEO
```

### 8.5 Pais sem Mercado Ativo

```
Usuario de Argentina acessa o site.
- IP: AR -> nao mapeado
- Accept-Language: es-AR -> es -> MX (mais proximo)
- Resultado: Sugere MX (mercado de lingua espanhola mais proximo)

Banner:
"Detectamos que voce esta na Argentina. Ainda nao temos mercado argentino,
mas voce pode usar nossa plataforma mexicana."
  [Ir para Mexico]  [Ver Brasil]  [Lista de espera AR]
```

---

## 9. SEO E CRAWLERS

### 9.1 hreflang Tags

Cada pagina deve ter tags alternativas:

```html
<link rel="alternate" hreflang="pt-BR" href="https://muuday.com/br/" />
<link rel="alternate" hreflang="es-MX" href="https://muuday.com/mx/" />
<link rel="alternate" hreflang="pt-PT" href="https://muuday.com/pt/" />
<link rel="alternate" hreflang="x-default" href="https://muuday.com/" />
```

### 9.2 Sitemap Internacional

```xml
<url>
  <loc>https://muuday.com/br/</loc>
  <xhtml:link rel="alternate" hreflang="pt-BR" href="https://muuday.com/br/"/>
  <xhtml:link rel="alternate" hreflang="es-MX" href="https://muuday.com/mx/"/>
</url>
```

### 9.3 Comportamento com Crawlers

- Root (/): versao default (BR), sem redirect automatico para crawlers.
- /br/ e /mx/: conteudo estatico, crawlavel.
- NAO usar redirect 302 baseado em IP para crawlers.
- Usar `Vary: Accept-Language` no header (mas isso e complexo; melhor usar hreflang).

---

## 10. METRICAS E ANALYTICS

### 10.1 Eventos a Trackear

| Evento | Quando | Para que Serve |
|--------|--------|----------------|
| market_detected | Sempre que detectamos | Entender acuracia do algoritmo |
| market_suggested | Quando mostra banner | Taxa de sugestao vs acerto |
| market_accepted | Quando clica "Sim, ir" | Taxa de aceitacao da sugestao |
| market_rejected | Quando clica "Nao" | Taxa de erro do algoritmo |
| market_changed | Quando muda via dropdown | Quem muda e por que |
| market_selector_opened | Quando abre dropdown | Uso do seletor |

### 10.2 Dashboard de Acuracia

```
Metricas:
- Taxa de deteccao correta: 85% (meta)
- Taxa de aceitacao de sugestao: 70% (meta)
- Taxa de mudanca manual: 15%
- Mercados mais confundidos: BR/PT, MX/ES
```

---

## 11. EVOLUCAO FUTURA

### 11.1 Machine Learning

Futuramente, podemos treinar um modelo simples:

```
Features:
  - Accept-Language (one-hot encoded)
  - IP country
  - Timezone
  - Hour of day (correlaciona com timezone real)
  - Screen resolution (mobile BR tende a ser diferente de mobile MX)
  
Target: mercado escolhido pelo usuario (ground truth)

Modelo: Random Forest ou XGBoost leve
Acuracia esperada: 90%+
```

### 11.2 Behavioral Signals

```
- Scroll pattern (brasileiros tendem a scrollar mais em certas secoes)
- Click pattern (interesse em guias fiscais BR vs MX)
- Time on page
- Search queries
```

### 11.3 Explicit Preference

```
- "Voce e brasileiro ou esta procurando por brasileiros?"
- Pergunta simples na primeira interacao (antes do booking)
- Usa essa resposta como ground truth para treinar o modelo
```

---

## 12. RESUMO DAS DECISOES

| Decisao | Valor |
|---------|-------|
| Deteccao | Inferencia probabilistica multi-sinal |
| Redirecionamento | Apenas na root (/) e apenas na primeira visita |
| Banner | Sugestivo, nao intrusivo, bilingue quando apropriado |
| Seletor | Dropdown no header, sempre acessivel |
| Persistencia | Cookie 1 ano + DB (se logado) |
| Idioma do banner | Idioma do mercado detectado + idioma atual |
| Fallback | Ingles quando nao ha overlap |
| Escalabilidade | Suporta N mercados via configuracao |
| SEO | hreflang, sem redirect para crawlers |


---

> **Document reviewed as part of comprehensive audit:** 2026-04-24. See docs/DOC-AUDIT-REPORT-2026-04-24.md for full findings.
