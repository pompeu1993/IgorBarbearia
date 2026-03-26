-- Correção de RLS para Admin ter acesso total à tabela appointments
DROP POLICY IF EXISTS "Admin can read all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can update all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can delete all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;

-- Cliente: Políticas normais
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);

-- Admin: Política de acesso total (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admin has full access to appointments" ON public.appointments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
