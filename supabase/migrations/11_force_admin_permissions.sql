-- Resolve missing admin role issues by explicitly updating the user and creating a robust RLS policy
-- 1. Ensure the user 'rafaelmiguelalonso@gmail.com' has 'admin' role in profiles
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'rafaelmiguelalonso@gmail.com'
);

-- 2. Provide a failsafe RLS policy for services and settings updates that checks both the profiles role OR the email directly
-- (Checking the email directly from auth.jwt() is 100% safe and bypasses recursive profile checks)

DROP POLICY IF EXISTS "Admin can update services" ON public.services;
CREATE POLICY "Admin can update services" ON public.services 
FOR UPDATE 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' 
    OR 
    auth.jwt()->>'email' = 'rafaelmiguelalonso@gmail.com'
);

DROP POLICY IF EXISTS "Admin full access to settings" ON public.settings;
CREATE POLICY "Admin full access to settings" ON public.settings 
FOR ALL 
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' 
    OR 
    auth.jwt()->>'email' = 'rafaelmiguelalonso@gmail.com'
);
