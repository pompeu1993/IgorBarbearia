-- The issue with the admin not seeing the appointments is that the RLS policy for the admin 
-- on the 'appointments' table is doing a circular or failing lookup when joined with 'profiles'.
-- And sometimes 'auth.uid()' behaves unexpectedly in joins if the policy isn't foolproof.

-- We will recreate the policy for appointments to be absolutely foolproof for the admin.

DROP POLICY IF EXISTS "Admin has full access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can read all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can update all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can delete all appointments" ON public.appointments;

CREATE POLICY "Admin has full access to appointments" 
ON public.appointments 
FOR ALL 
USING (
    -- Permite acesso total se for o admin usando a verificação de e-mail 100% segura
    -- ou se o role for admin no profile.
    auth.jwt()->>'email' = 'rafaelmiguelalonso@gmail.com'
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- IMPORTANT: Check the profiles policy as well. If the admin can't read the client's profile,
-- the inner join "profiles!appointments_user_id_fkey" will DROP the entire row from the result.

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
    auth.jwt()->>'email' = 'rafaelmiguelalonso@gmail.com'
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
