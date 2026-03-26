-- 1. Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client';

-- 2. Update existing user if any
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'rafaelmiguelalonso@gmail.com'
);

-- 3. Update the trigger to automatically make this email an admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_admin BOOLEAN := false;
BEGIN
  IF new.email = 'rafaelmiguelalonso@gmail.com' THEN
    is_admin := true;
  END IF;

  INSERT INTO public.profiles (id, name, phone, cpf, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf',
    CASE WHEN is_admin THEN 'admin' ELSE 'client' END
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    cpf = EXCLUDED.cpf,
    role = CASE WHEN is_admin THEN 'admin' ELSE EXCLUDED.role END;
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'Erro de unicidade ao criar perfil para o usuário %: %', new.id, SQLERRM;
    RETURN new;
  WHEN others THEN
    RAISE LOG 'Erro desconhecido ao criar perfil para o usuário %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    allow_rescheduling BOOLEAN DEFAULT true,
    operating_days JSONB DEFAULT '[1, 2, 3, 4, 5, 6]'::jsonb,
    disabled_dates JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default settings if empty
INSERT INTO public.settings (id, allow_rescheduling, operating_days, disabled_dates)
SELECT 1, true, '[1, 2, 3, 4, 5, 6]'::jsonb, '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE id = 1);

-- RLS for settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for settings" ON public.settings;
CREATE POLICY "Public read access for settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access to settings" ON public.settings;
CREATE POLICY "Admin full access to settings" ON public.settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Update RLS for profiles so users can read their own, and admins can read all
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;

CREATE POLICY "Users can view own profile or admin can view all" ON public.profiles FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- RLS for services so admin can update
DROP POLICY IF EXISTS "Admin can update services" ON public.services;
CREATE POLICY "Admin can update services" ON public.services FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- RLS for appointments so admin can read/update all
DROP POLICY IF EXISTS "Admin can read all appointments" ON public.appointments;
CREATE POLICY "Admin can read all appointments" ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "Admin can update all appointments" ON public.appointments;
CREATE POLICY "Admin can update all appointments" ON public.appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
