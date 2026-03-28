# Setup Independente (Zero impacto no deploy)

Objetivo: preparar materiais e estrutura que ajudam o Claude depois, sem alterar lógica da aplicação.

## O que já foi preparado

1. [ROADMAP_CLAUDE_MAKE_HUBSPOT.md](../roadmaps/ROADMAP_CLAUDE_MAKE_HUBSPOT.md)
2. [RELATORIO_AUDITORIA_COMPLETA_PARA_CLAUDE.md](../reports/RELATORIO_AUDITORIA_COMPLETA_PARA_CLAUDE.md)
3. [RELATORIO_AUDITORIA_COMPLETA_PARA_CLAUDE.pdf](../reports/RELATORIO_AUDITORIA_COMPLETA_PARA_CLAUDE.pdf)

## Coisas que posso configurar AGORA sem risco de produção

1. Templates de prompts para Claude por fase (security, growth, ops).
2. Checklist de PR/deploy/release em markdown.
3. Contrato de eventos (lista oficial de eventos + propriedades).
4. Mapa Muuday -> HubSpot (campos, origem, atualização).
5. Playbooks Make (entrada, filtros, idempotência, retries).
6. Backlog priorizado em formato pronto para execução (P0/P1/P2).
7. Definição de KPIs e dashboards-alvo (PostHog/HubSpot).
8. Plano de incident response (falha de booking, falha de pagamento, falha de email).
9. Runbook de onboarding de profissional (operacional).
10. Matriz de risco e testes de regressão por fluxo.

## Coisas que NÃO altero sem sua autorização explícita

1. Código de rotas, server actions e middleware.
2. SQL migrations aplicadas ao banco.
3. Configuração de produção no Vercel/Supabase/HubSpot/Make.
4. Webhooks ativos e automações em ambiente real.

## Ordem recomendada para setup independente

1. Contrato de eventos
2. Mapeamento HubSpot
3. Playbooks Make
4. Checklist de deploy
5. Backlog executável para Claude

## Definição prática de "independente"

1. Somente arquivos de documentação/templates.
2. Nenhuma mudança no runtime do app.
3. Nenhuma mudança em infraestrutura de produção.
