# Setups Independentes Sem Risco (Nao alteram logica de producao)

Objetivo: preparar terreno para Claude/Codex sem tocar comportamento funcional ja deployado.

## O que eu posso configurar 100% independente agora

## A. Documentacao e operacao (zero impacto em runtime)

1. Estrutura `docs/` com:
- arquitetura atual
- mapa de dados (Supabase)
- mapa de automacoes (Make)
- mapa de lifecycle (HubSpot)

2. Templates padrao:
- `PR_TEMPLATE.md`
- `ISSUE_TEMPLATE` (bug, feature, incident)
- runbook de incidentes (`booking`, `email`, `payment`)

3. Checklists:
- checklist de release
- checklist de rollback
- checklist de validacao manual por fluxo

## B. Governanca de codigo (sem mudar logica de app)

1. Configurar ESLint e Prettier versionados.
2. Adicionar `.editorconfig` e padrao de line endings.
3. Criar scripts de qualidade (`typecheck`, `lint`, `build`).

Obs: isso nao muda regra de negocio; so padroniza qualidade.

## C. CI/CD leve no GitHub (sem alterar runtime da app)

1. Workflow `ci.yml`:
- install
- typecheck
- lint
- build

2. Workflow opcional `security.yml`:
- `npm audit` agendado
- relatorio automatizado em issue

## D. Migrations e SQL draft (sem aplicar automaticamente)

1. Criar pasta `supabase/migrations-draft/`.
2. Escrever scripts SQL de hardening como `draft`:
- RLS profiles
- RLS waitlist
- trilha de auditoria booking

Obs: criar arquivo nao aplica nada em banco.

## E. Especificacoes de dados para Make + HubSpot (somente blueprint)

1. Arquivo de mapeamento de campos (`json`/`md`):
- evento -> propriedade HubSpot
- status Muuday -> stage HubSpot

2. Blueprint de cenarios Make:
- triggers
- modules
- retries
- dead-letter

Obs: sem conectar token, sem disparar automacao.

## F. Instrumentacao plan (sem enviar dados ainda)

1. Plano de eventos PostHog documentado.
2. Taxonomia de eventos e propriedades.
3. Matriz KPI por etapa de funil.

## G. Backlog executavel para Claude/Codex

1. Arquivo com tarefas P0/P1/P2.
2. Criticos com criterio de aceite e estimativa.
3. Ordem de execucao por dependencias.

## O que eu NAO consigo fazer sozinho sem sua acao (depende de credenciais/painel)

1. Criar/editar cenarios no Make real.
2. Criar pipelines/properties no HubSpot real.
3. Alterar variaveis de ambiente em Vercel/Supabase cloud.
4. Aplicar migrations em producao.
5. Configurar Stripe Connect em conta live.

## Ordem recomendada de setup independente (rapido)

1. Documentacao + templates
2. ESLint/Prettier + scripts de qualidade
3. GitHub CI basico
4. SQL drafts de hardening
5. Blueprints Make/HubSpot
6. Plano de eventos PostHog

## Definicao de "sem risco"

- sem alteracao em `app/`, `lib/actions/`, `app/api/` de regra de negocio
- sem aplicacao de migration no banco
- sem deploy automatico forcado
- sem mudanca de comportamento para usuario final

