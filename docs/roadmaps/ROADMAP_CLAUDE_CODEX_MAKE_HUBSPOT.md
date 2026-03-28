# Muuday Roadmap Mestre (Claude + Codex + Make + HubSpot)

Data: 2026-03-27
Objetivo: crescer com seguranca, confiabilidade e operacao de marketplace sem custo alto.

## 1. Estrategia

- Manter stack base: Next.js + Vercel + Supabase + Stripe + GitHub.
- Usar Make como camada de automacao operacional.
- Usar HubSpot como CRM principal de supply/demand.
- Priorizar sistemas de marketplace: `supply`, `trust`, `booking`, `retention`, `ops`.

## 2. Divisao de papeis

### Claude (planejamento e produto)

1. Definir fluxo de negocio e regras de operacao.
2. Definir contratos de dados (eventos, stages, automacoes).
3. Especificar cada fase com criterio de aceite.
4. Priorizar backlog por impacto x risco.

### Codex (execucao tecnica)

1. Implementar patches de codigo e migrations.
2. Rodar verificacoes (build, audit, testes).
3. Entregar PRs/commits pequenos por modulo.
4. Produzir runbooks tecnicos e checklists de deploy.

Regra: nunca os dois editando os mesmos arquivos ao mesmo tempo.

## 3. Roadmap por fases (12 semanas)

## Fase 0 (Semana 1) - Foundation de seguranca e estabilidade

Objetivo: remover riscos criticos e travar baseline.

1. Atualizar dependencias de risco (Next + pacote criticos).
2. Corrigir autorizacao de booking (professional_id vs user.id).
3. Blindar createBooking (preco/duracao/horario 100% server-side).
4. Endurecer waitlist API (validacao, CORS allowlist, rate-limit, idempotencia).
5. Corrigir RLS sensivel (profiles e waitlist).
6. Configurar lint versionado + CI minimo.

DoD:
- `build` e `lint` rodam sem prompt.
- sem vulnerabilidade critica aberta em `npm audit`.
- fluxos de agenda profissional funcionando ponta a ponta.

## Fase 1 (Semanas 2-3) - Booking engine confiavel

Objetivo: booking robusto internacional (fuso e estado).

1. Normalizar timezone (persistir UTC e converter para exibicao).
2. Reescrever conflito de horario no servidor (interval overlap correto).
3. Consolidar maquina de estados de booking (`pending`, `confirmed`, `completed`, `cancelled`, `no_show`).
4. Criar trilha de auditoria de mudancas de status.
5. E2E dos fluxos criticos (agendar, confirmar, cancelar, concluir, avaliar).

DoD:
- sem agendamento duplicado em cenarios concorrentes.
- exibicao correta em multiplos fusos.
- historico/auditoria disponivel para suporte.

## Fase 2 (Semanas 4-5) - Trust & moderation

Objetivo: aumentar confianca e qualidade da oferta.

1. Pipeline de verificacao de profissional (status + checklist + evidencias).
2. Reviews server-side com validacao de ownership.
3. Painel admin com trilha de aprovacao/rejeicao.
4. Politicas claras de suspensao, recursos e prazos.
5. Paginas legais: termos, privacidade, cookies, suporte.

DoD:
- nenhum review invalido aceito.
- moderacao com historico de quem fez o que.
- compliance minimo publicado.

## Fase 3 (Semanas 6-8) - Ops & automation (Make + HubSpot)

Objetivo: transformar operacao manual em sistema.

1. Modelo unico de lifecycle no HubSpot:
   - `new_lead` -> `contacted` -> `qualified` -> `onboarding` -> `approved` -> `active`
2. Cenarios Make (prioridade alta):
   - waitlist -> HubSpot contact upsert
   - novo profissional draft -> tarefa de onboarding
   - profile pending_review -> ticket interno
   - booking confirmed -> lembretes 24h/1h
   - completed -> pedido de review + nudge de rebooking
3. Dead-letter/retry e alerta de falha de automacao.
4. Dashboard operacional (SLAs, pendencias, gargalos).

DoD:
- automacoes com logs e retries.
- nenhum lead novo sem registro no HubSpot.
- lembretes e follow-ups funcionando em producao.

## Fase 4 (Semanas 9-10) - Growth engine

Objetivo: previsibilidade de crescimento e qualidade de funil.

1. Instrumentacao PostHog completa:
   - visitou, cadastrou, completou conta, agendou, concluiu, avaliou, rebook.
2. Funis por pais e por canal.
3. Segmentacoes lifecycle para campanhas (Make + HubSpot + Resend).
4. Reengajamento automatico para inativos.

DoD:
- dashboard de funil semanal.
- cohort de rebooking visivel por pais/categoria.

## Fase 5 (Semanas 11-12) - Monetizacao e escala inicial

Objetivo: preparar crescimento com receita controlada.

1. Evoluir para Stripe Connect (se volume justificar).
2. Definir politica de taxa/take-rate e reembolso.
3. Relatorios financeiros basicos no admin.
4. Hardening final de observabilidade (Sentry + alertas uptime).

DoD:
- fluxo de pagamento com visibilidade operacional.
- playbook de incidentes financeiros.

## 4. Backlog de automacoes Make (detalhado)

1. `Waitlist Intake`
- Trigger: webhook `/api/waitlist`.
- Acoes: upsert no HubSpot + tag source + owner + tarefa de follow-up.
- Guardrails: idempotencia por email; retry 3x.

2. `Professional Onboarding Pipeline`
- Trigger: profile criado/atualizado para `pending_review`.
- Acoes: criar ticket HubSpot, checklist de documentos, notificar canal ops.

3. `Booking Reminder 24h/1h`
- Trigger: booking `confirmed`.
- Acoes: agendar email/WhatsApp, log de envio, fallback se falhar.

4. `Post-session Review + Rebook`
- Trigger: booking `completed`.
- Acoes: email review, se review concluido -> nudge de rebooking em 7 dias.

5. `No-show Recovery`
- Trigger: booking `no_show`.
- Acoes: contato de suporte, proposta de remarcacao, log de risco churn.

## 5. Backlog HubSpot (detalhado)

1. Criar propriedades custom:
- `muuday_role`
- `lifecycle_stage_muuday`
- `country`
- `timezone`
- `first_booking_at`
- `last_booking_status`
- `total_completed_sessions`

2. Criar pipelines:
- Pipeline `Professional Supply`
- Pipeline `User Activation`

3. Criar listas dinamicas:
- profissionais pendentes > 48h
- usuarios cadastrados sem booking
- usuarios com booking concluido sem review

4. Criar score simples:
- atividade recente
- completude de perfil
- taxa de comparecimento

## 6. Prompt mestre para Claude (copiar e colar)

```md
Trabalhe em modo arquiteto+PM para executar o roadmap Muuday.
Nao escreva codigo inicialmente; primeiro entregue plano detalhado por fase.

Contexto:
- Stack: Next.js + Vercel + Supabase + Stripe + Resend + PostHog + Sentry
- Ferramentas contratadas: Make (plano inicial) e HubSpot pago
- Objetivo: marketplace confiavel e escalavel com baixo custo

Quero:
1) Plano por fase (0 a 5) com prioridades P0/P1/P2
2) Especificacao de dados para Make + HubSpot
3) Criterios de aceite por item
4) Riscos e rollback por fase
5) Ordem de execucao para Codex implementar

Depois do plano aprovado, gere tarefas implementaveis em blocos pequenos.
```

## 7. Prompt de execucao para Codex (copiar e colar)

```md
Execute o bloco aprovado da fase atual do roadmap Muuday.
Regras:
- commits atomicos
- nao tocar em modulo fora do escopo
- validar build/lint/teste
- listar riscos restantes

Entregue:
1) diff tecnico
2) checklist de verificacao
3) status de deploy readiness
```

