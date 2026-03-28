# Muuday App

Plataforma que conecta brasileiros no exterior a profissionais brasileiros.

## Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend/DB/Auth**: Supabase
- **Estilo**: Tailwind CSS
- **Deploy**: Vercel

## Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configurar banco de dados
- Acesse seu projeto no [Supabase](https://supabase.com)
- Vá em **SQL Editor**
- Cole e execute o conteúdo de `db/sql/schema/supabase-schema.sql`

### 4. Rodar localmente
```bash
npm run dev
```

Acesse: http://localhost:3000

## Estrutura do projeto
```
app/
  (auth)/          # Login, cadastro, recuperar senha
  (app)/           # Área logada - dashboard, busca, perfil
  auth/            # Callbacks de autenticação
lib/
  supabase/        # Clients do Supabase (browser, server, middleware)
  utils/           # Funções utilitárias (moedas, datas, países)
db/
  sql/
    schema/        # Schema base
    migrations/    # Migrations SQL incrementais
docs/              # Handoffs, roadmaps, setup e relatórios
artifacts/         # Logs/snapshots arquivados (não usados em runtime)
types/             # Tipos TypeScript
```
