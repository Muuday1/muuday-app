# Roadmap Claude - Muuday + Make + HubSpot

Data: 2026-03-27  
Objetivo: acelerar crescimento e operação da Muuday sem aumentar risco técnico.

## Princípios de execução

1. Fonte de verdade do produto: Supabase.
2. HubSpot = CRM e pipeline comercial/relacionamento (espelho inteligente).
3. Make = orquestração e automações (não lógica crítica de produto).
4. Deploy seguro: qualquer mudança de lógica passa por branch + PR + checks.
5. Fasear por impacto: segurança e integridade primeiro, growth depois.

## Arquitetura operacional alvo (simples e escalável)

1. App (Next.js/Vercel) gera eventos de domínio.
2. Eventos são persistidos no Supabase (ou enviados por webhook interno).
3. Make consome eventos e sincroniza com HubSpot.
4. HubSpot alimenta funil, segmentação e playbooks de vendas/sucesso.
5. Resend/WhatsApp executam comunicação transacional e lifecycle.

## Fase 0 - Baseline e segurança (Semana 1)

Objetivo: eliminar riscos críticos antes de acelerar growth.

Tarefas para Claude:
1. Atualizar dependências de risco (Next e relacionadas).
2. Corrigir autorização de bookings (`professional_id` vs `user.id`).
3. Blindar criação de booking contra tampering de preço/duração.
4. Endurecer endpoint de waitlist (validação, rate-limit, CORS allowlist).
5. Revisar policies RLS de `profiles` e `waitlist`.

Aceite:
1. `npm run build` passa.
2. Nenhuma rota principal com regressão.
3. Fluxo login -> booking -> agenda funciona ponta a ponta.

## Fase 1 - Instrumentação e visibilidade (Semana 2)

Objetivo: parar de operar no escuro.

Tarefas para Claude:
1. Definir taxonomia de eventos de produto.
2. Instrumentar eventos no PostHog:
   - `signup_started`
   - `signup_completed`
   - `booking_started`
   - `booking_created`
   - `booking_confirmed`
   - `session_completed`
   - `review_submitted`
3. Integrar Sentry (frontend + server actions + API routes).
4. Criar dashboard inicial de funil.

Aceite:
1. Eventos chegam com propriedades consistentes.
2. Funil completo visível por país e role.
3. Erros críticos geram alertas.

## Fase 2 - HubSpot foundation (Semana 3)

Objetivo: tornar CRM acionável sem duplicar lógica de produto.

Tarefas para Claude:
1. Definir mapeamento de entidades Muuday -> HubSpot:
   - Contact (usuário/profissional)
   - Company (opcional, para profissionais B2B)
   - Deal (pipeline de onboarding profissional)
2. Criar contrato de propriedades padrão no HubSpot:
   - `muuday_role`
   - `muuday_country`
   - `muuday_timezone`
   - `muuday_first_booking_at`
   - `muuday_total_bookings`
   - `muuday_professional_status`
3. Definir regras de deduplicação por email + external id.
4. Configurar pipelines:
   - Pipeline de supply (profissional): lead -> contato -> docs -> aprovado -> ativo.
   - Pipeline de demand (usuário): lead -> ativado -> primeira sessão -> recorrente.

Aceite:
1. Contacts sincronizados sem duplicata.
2. Propriedades críticas atualizadas por automação.
3. Pipeline representa status real do produto.

## Fase 3 - Make automations (Semana 4)

Objetivo: automatizar operação repetitiva e aumentar conversão.

Cenários Make prioritários:
1. Waitlist -> HubSpot contact upsert + tag de origem.
2. Novo profissional cadastrado -> criar deal de onboarding + tarefa de follow-up.
3. Profissional pendente > 48h -> alerta para ops.
4. Booking criado -> atualizar propriedades e criar timeline event no HubSpot.
5. Sessão concluída -> trigger de review + nudge de rebooking.
6. Usuário inativo 14 dias -> sequência de reativação.

Aceite:
1. Todos cenários com retry + idempotência.
2. Erros críticos em cenário disparam alerta.
3. Taxa de sucesso de automação > 98%.

## Fase 4 - Trust e qualidade marketplace (Semana 5-6)

Objetivo: elevar confiança e liquidez.

Tarefas para Claude:
1. Workflow de verificação de profissional no admin.
2. Trilhas de auditoria para ações admin (quem, quando, o quê).
3. Moderação de reviews (fila + decisão + motivo).
4. Regras claras de suspensão/rejeição.

Aceite:
1. Processo de aprovação rastreável.
2. Menor tempo médio de onboarding.
3. Menos incidentes de confiança/suporte.

## Fase 5 - Retenção e receita (Semana 7+)

Objetivo: aumentar recorrência e LTV.

Tarefas para Claude:
1. Lifecycle emails por estágio (Resend + Make + HubSpot).
2. Segmentação por comportamento (RFM simples).
3. Playbooks:
   - pós-primeira sessão
   - abandono de agendamento
   - profissional sem resposta

KPIs:
1. Signup -> 1º booking
2. 1º booking -> 2º booking (retenção)
3. No-show rate
4. Conversão de profissional pendente -> aprovado

## Governance (sempre)

1. Cada fase em branch separada (`codex/...`).
2. Commits pequenos por domínio.
3. Check obrigatório: build + smoke dos fluxos principais.
4. Nada de mudança em produção sem rollback claro.

## Prompt padrão para Claude (execução de fase)

```md
Execute a fase [X] do ROADMAP_CLAUDE_MAKE_HUBSPOT.md.

Regras:
1) Não alterar lógica fora do escopo da fase.
2) Commits atômicos por domínio.
3) Entregar: diff, testes executados, riscos remanescentes, checklist de deploy.
4) Se houver ambiguidade, manter comportamento atual e abrir TODO explícito.
```

