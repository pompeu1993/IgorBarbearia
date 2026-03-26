-- 1. Assegurar que as colunas existem na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;

-- 2. Corrigir a chave estrangeira para Deletar em Cascata (Cascade Delete)
-- Assim, se você deletar o usuário no menu "Authentication", o perfil dele também é deletado.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 3. Recriar a função do Trigger com tratamento de erros robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, cpf)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    cpf = EXCLUDED.cpf;
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Se der erro de CPF duplicado no banco, não aborta a criação do usuário
    RAISE LOG 'Erro de unicidade ao criar perfil para o usuário %: %', new.id, SQLERRM;
    RETURN new;
  WHEN others THEN
    -- Ignora outros erros do banco de dados para garantir que o usuário seja criado
    RAISE LOG 'Erro desconhecido ao criar perfil para o usuário %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Garantir que o trigger está devidamente associado ao auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
