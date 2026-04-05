# Esquema do Banco de Dados (Supabase / PostgreSQL)

O sistema abandonou o Prisma/SQLite em favor do Supabase (PostgreSQL) com acesso direto via Supabase JS Client e segurança baseada em Row Level Security (RLS).

Abaixo está o esquema simplificado do banco de dados atualmente em uso:

```sql
-- Extensão do usuário autenticado no Supabase (auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  phone TEXT,
  cpf TEXT, -- Não é mais UNIQUE obrigatório para suportar Ghost Users
  avatar_url TEXT,
  role TEXT DEFAULT 'client', -- 'admin' ou 'client'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Serviços oferecidos
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30, -- Em minutos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agendamentos
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED, COMPLETED
  payment_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, FAILED, CANCELLED
  payment_id TEXT, -- ID da transação no Asaas
  user_id UUID REFERENCES auth.users(id), -- Opcional para suportar falhas na geração de Ghost Users
  service_id UUID REFERENCES services(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurações globais do sistema
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  allow_rescheduling BOOLEAN DEFAULT true,
  operating_days JSONB DEFAULT '[1, 2, 3, 4, 5, 6]'::jsonb, -- 0=Domingo, 1=Segunda...
  disabled_dates JSONB DEFAULT '[]'::jsonb, -- Datas específicas bloqueadas
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

## Relacionamentos Principais
- `appointments.user_id` -> `auth.users(id)` (e consequentemente a `profiles(id)`)
- `appointments.service_id` -> `services(id)`

## Row Level Security (RLS) Resumo
- `profiles`: Cada usuário pode ver e editar apenas seu próprio perfil. O perfil com `role = 'admin'` pode ver todos.
- `appointments`: Usuários comuns têm acesso CRUD apenas aos seus próprios agendamentos. O administrador tem acesso total a todos.
- `services` e `settings`: Leitura liberada para todos (pública), porém apenas usuários com `role = 'admin'` podem inserir, atualizar ou excluir registros.
