# Handoff de Execucao para Claude (Muuday)

## Contexto e objetivo
- Projeto: `muuday-app`
- Branch: `main`
- Objetivo: continuar a evolucao do produto com seguranca, sem regressao, e sem conflito de trabalho com Codex.
- Regra operacional: **nunca rodar Claude e Codex ao mesmo tempo no mesmo bloco de trabalho**.

## Estado atual confirmado
- Login social esta no codigo e visivel no deploy:
  - Google, Apple, Facebook presentes em `/login`.
- E2E smoke principal feito:
  - login
  - criar/completar perfil profissional
  - aprovar profissional no admin
  - criar agendamento
  - cancelar agendamento pelo lado do usuario
- Bug relevante identificado:
  - acao de confirmar/cancelar pelo lado do profissional nao persiste em alguns casos (suspeita forte de politica RLS/ownership de update em `bookings`).

## Nao negociaveis
- Nao deletar nada sem confirmacao explicita.
- Nao mexer em logica ja deployed sem plano claro.
- Nao alterar schema/policies em producao sem migration reversivel.
- Sempre mostrar diff antes de mudancas de alto risco.
- Cada bloco de trabalho termina com:
  1. testes executados
  2. riscos
  3. commit(s)
  4. proximo passo recomendado

## Prioridades (ordem obrigatoria)

### P0 - Confiabilidade de booking e operacao
1. Corrigir fluxo de confirmar/cancelar pelo profissional.
2. Revisar e corrigir RLS de `bookings` para permitir update por:
   - dono do booking (`user_id`)
   - profissional da sessao (`professional_id` relacionado)
   - admin (quando aplicavel)
3. Adicionar validacoes de transicao de estado (`pending -> confirmed/cancelled`, etc).
4. Criar testes (ou scripts de verificacao) para garantir que:
   - usuario cancela
   - profissional confirma/cancela
   - admin atua sem quebrar regra de seguranca

### P0 - Auth social pronto para producao
1. Confirmar providers no Supabase (Google/Facebook/Apple).
2. Confirmar URLs de callback para dominio final:
   - `muuday.com`
   - `www.muuday.com` (se usado)
3. Garantir consistencia entre ambientes (Preview/Production).
4. Criar checklist de go-live de auth social (passo a passo).

### P0 - Deploy/domain base
1. Ajustar estrategia de dominio final:
   - dominio principal: `muuday.com`
   - `app.muuday.com` apenas se mantiver area separada
2. Configurar/validar DNS + TLS + redirect canonico.
3. Garantir que todas as variaveis de ambiente essenciais estao em Production no Vercel.

## Stack e upgrades (baixo custo / alto impacto)

### Implementar agora (alto ROI)
1. **PostHog**
   - funil completo: visita -> cadastro -> busca -> agendamento -> pagamento -> retorno
   - eventos obrigatorios com `user_id`, `professional_id`, `country`, `source`
2. **Sentry**
   - erros frontend + backend
   - tags de fluxo critico (`auth`, `booking`, `payment`)
3. **Resend**
   - emails transacionais: confirmacao, cancelamento, lembrete
   - lifecycle: onboarding e reativacao leve
4. **Cloudflare**
   - DNS, WAF basico, cache e protecao minima
5. **Uptime monitor**
   - UptimeRobot ou Better Stack Uptime para monitorar disponibilidade
6. **GitHub Actions minimo**
   - install, lint, typecheck, build
7. **Zod**
   - validar input em API routes/server actions
8. **Rate limiting**
   - Upstash Redis free tier ou tabela Supabase (se preferir custo zero)
9. **Make + HubSpot**
   - Make: automacoes operacionais e growth
   - HubSpot: CRM leve para aquisicao de profissionais

### Depois (quando houver necessidade real)
1. Upstash Redis mais avancado (cache/queue)
2. Pinecone (busca semantica/recomendacao)
3. Ferramentas extras de AI matching

## Sistemas de marketplace que devem existir (visao produto)
1. Motor de oferta (aquisicao de profissionais + onboarding)
2. Camada de confianca (verificacao, reviews, moderacao)
3. Motor de booking (slots, timezone, remarcacao, cancelamento)
4. Motor de retencao (lembrete, follow-up, rebooking)
5. Painel operacional/admin (aprovacao, suporte, excecoes)

## Entregas que Claude deve produzir por fase

### Fase 1 (base segura)
- Corrigir booking profissional + RLS + testes
- Pipeline GitHub Actions minimo
- Zod nos endpoints criticos
- Rate limit em auth/booking/waitlist

### Fase 2 (observabilidade e comunicacao)
- Sentry completo
- PostHog com taxonomia de eventos
- Resend para emails transacionais (booking e auth)
- Uptime monitor configurado

### Fase 3 (growth e ops)
- Make: fluxos de outreach/follow-up
- HubSpot: pipeline de profissionais + status de onboarding
- Admin improvements para operacao diaria

## Regras de colaboracao Claude x Codex
1. Claude implementa features e plano.
2. Codex faz review tecnico final, QA, seguranca, verificacao de regressao e commit/polish.
3. Nunca paralelizar trabalho dos dois na mesma janela.
4. Ao trocar de ferramenta, deixar handoff curto:
   - o que mudou
   - o que falta
   - riscos
   - como validar

## Prompt pronto para iniciar no Claude
Use exatamente este prompt no inicio:

```text
Quero que voce execute este plano no repo atual em fases, com foco em seguranca, confiabilidade e zero regressao.

Regras:
1) Nao deletar nada sem minha aprovacao.
2) Nao alterar logica deployed sem explicar risco e plano de rollback.
3) Implementar em pequenos commits, com testes e checklist de validacao.
4) Sempre me entregar: diff resumido, testes rodados, riscos, proximo passo.

Prioridade imediata:
- Corrigir confirmar/cancelar booking pelo profissional (incluindo RLS/policies).
- Garantir fluxos de estado de booking robustos.
- Configurar base minima de qualidade: GitHub Actions (lint/typecheck/build), Zod em APIs criticas, rate limit em auth/booking.

Depois:
- Sentry (frontend/backend) com tags de fluxo.
- PostHog com funil completo e eventos chave.
- Resend para emails transacionais e lifecycle basico.
- Uptime monitor (UptimeRobot ou Better Stack).
- Integracao Make + HubSpot para aquisicao/onboarding de profissionais.

Contexto de dominio:
- O dominio final sera muuday.com.
- Marketplace de servicos para brasileiros no exterior.
- Sistemas criticos: supply, trust, booking, retention, ops/admin.

Importante:
- Trabalhar fase a fase e parar ao final de cada fase para minha aprovacao.
```

## Observacao final
- Se houver arquivo temporario local (`tmp_*`), apenas ignorar no trabalho de produto.
- Caso precise limpar temporarios, pedir confirmacao antes.
