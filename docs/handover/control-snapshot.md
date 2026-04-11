# Control Snapshot — 2026-04-11

## Feito
- Wave 2 segue fechada e o bloco de estabilização pública foi publicado em produção.
- Landing (`/`) e `registrar-profissional` foram enxugadas para notebook/laptop, com hero media mais limpo e estrutura pronta para swap de imagens reais sem retrabalho de layout.
- O shell público foi mantido coerente com sessão autenticada, com fallback seguro para usuários logados.
- A busca pública ganhou resumo de filtros mais claro para `categoria -> subcategoria -> especialidade` e estado vazio mais objetivo.
- SQL 033 já estava aplicada/validada; não havia nova execução útil de SQL pendente neste bloco sem abrir escopo de negócio.
- O gatilho `payments -> /api/webhooks/supabase-db` continua validado com retorno `202` em `net._http_response`.
- `Skew Protection` segue habilitado no Vercel (`max age: 12h`).
- Gate técnico deste bloco fechado com:
  - `lint` OK
  - `typecheck` OK
  - `build` OK
  - `test:state-machines` OK
  - `test:e2e`: `12 passed`, `1 skipped`
- Deploy publicado em produção: `https://muuday-jsoj796rs-muuday1s-projects.vercel.app`

## Pendente
- Integrar imagens reais nas páginas públicas quando os assets forem entregues.
- Rodar uma rodada visual dedicada em mobile depois da troca das imagens reais.
- Fechar o `1 skipped` remanescente do E2E (`manual confirmation`) se ele continuar no próximo ciclo.

## Bloqueio
- PITR permanece adiado por custo até o período imediatamente anterior ao lançamento de pagamentos reais.
- `app.muuday.com` continua sem resolução DNS local nesta máquina; a validação HTTP foi feita pela URL de produção da Vercel.

## Próximo
1. Integrar os assets reais da landing e de `registrar-profissional` assim que forem gerados.
2. Fazer a rodada de mobile polish com os assets finais já aplicados.
3. Revisar novamente busca pública/autenticada após essa integração para manter ritmo visual e consistência de taxonomia.
4. Reabrir Wave 3 só depois desse bloco visual estar consolidado.
