# Control Snapshot — 2026-04-11

## Feito
- Wave 2 foi encerrada e assinada como concluída.
- `main` está operacionalmente estável após os últimos patches de navegação pública/logada.
- SQL 033 foi aplicada no projeto Supabase com os jobs e o gatilho operacional previstos.
- O gatilho `payments -> /api/webhooks/supabase-db` foi validado com retorno `202` em `net._http_response`.
- `Skew Protection` está habilitado no Vercel (`max age: 12h`).
- A policy de Supabase branching foi travada como `branch por PR`, com exceção apenas para hotfix emergencial seguido de backfill.
- O workspace canônico continua sendo `C:\dev\muuday-app`.

## Pendente
- Integrar imagens reais nas páginas públicas quando os assets forem entregues.
- Fechar o próximo bloco de polish visual nas páginas públicas e de entrada do onboarding profissional.
- Revalidar smoke visual pós-polish em laptop, mobile e fluxo autenticado/deslogado.

## Bloqueio
- PITR permanece adiado por custo até o período imediatamente anterior ao lançamento de pagamentos reais.
- Não há bloqueio técnico imediato para o shell público, busca ou onboarding-entry neste momento.

## Próximo
1. Refinar landing e `registrar-profissional` para uma composição mais limpa em notebook/laptop.
2. Preparar os hero blocks para swap direto de imagens reais sem reestruturação.
3. Revisar a busca pública/autenticada para manter taxonomia e navegação coerentes.
4. Rodar gate final de qualidade e atualizar o handover curto ao fim do bloco.
