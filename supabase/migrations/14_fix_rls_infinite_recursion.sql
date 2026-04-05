-- Fix Infinite Recursion in 'profiles' policy
-- The error "infinite recursion detected in policy for relation 'profiles'" happens because
-- the policy "Admins can view all profiles" does a SELECT on 'profiles' to check if the user is an admin.
-- Since the policy itself is ON 'profiles', evaluating the policy triggers another SELECT on 'profiles',
-- which triggers the policy again, leading to an infinite loop.

-- To fix this, we need to check the admin role WITHOUT querying the 'profiles' table directly inside its own policy.
-- The best way is to rely strictly on the JWT claims (if the role is stored there) or just the email for the master admin.
-- Another approach is to create a SECURITY DEFINER function to check the role, bypassing RLS.

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a secure function to check admin status bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the policy using the secure function and the email fallback
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
    auth.jwt()->>'email' = 'rafaelmiguelalonso@gmail.com'
    OR
    public.is_admin(auth.uid())
);

-- Also fix the appointments policy to use the same secure function just to be safe
DROP POLICY IF EXISTS "Admin has full access to appointments" ON public.appointments;

CREATE POLICY "Admin has full access to appointments" 
ON public.appointments 
FOR ALL 
USING (
    auth.jwt()->>'email' = 'rafaelmiguelalonso@gmail.com'
    OR
    public.is_admin(auth.uid())
);
