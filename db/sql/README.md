# Database SQL Structure

- `db/sql/schema/`: schema base da aplicacao.
- `db/sql/migrations/`: migrations incrementais.

Uso recomendado:

1. Ambientes novos: aplicar `schema/supabase-schema.sql`.
2. Ambientes existentes: aplicar apenas migrations necessarias em ordem de release.
