-- A tabela appointments originalmente faz referência a auth.users(id).
-- Para que o frontend possa fazer JOIN diretamente com a tabela profiles no Supabase (usando `profiles(name)`),
-- precisamos adicionar uma Foreign Key explícita entre public.appointments.user_id e public.profiles.id.

-- 1. Removemos a constraint antiga (se o nome padrão foi appointments_user_id_fkey apontando para auth.users)
-- Como não temos certeza do nome exato da constraint gerada pelo Supabase, vamos tentar removê-la ou apenas adicionar uma nova.
-- O mais seguro é adicionar uma nova constraint específica para o profiles.

ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;

ALTER TABLE public.appointments
ADD CONSTRAINT appointments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Isso permitirá que as queries do painel Admin:
-- .select("..., profiles!appointments_user_id_fkey(name, phone)") funcionem perfeitamente.
