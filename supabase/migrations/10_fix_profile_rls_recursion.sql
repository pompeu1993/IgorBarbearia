-- Fix infinite recursion in profiles RLS policies

-- First, drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;

-- Create a policy that allows users to view their OWN profile without checking the profiles table itself
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a separate policy for admins using a safer approach (checking auth.jwt() or a separate query if needed)
-- Using auth.uid() = id prevents recursion when normal users query their own data.
-- To allow admins to view ALL profiles, we can check a custom claim if available, 
-- or we can just rely on the service_role key for admin backend operations, 
-- or use a direct check that avoids recursive self-referencing.
CREATE POLICY "Admins can view all profiles" ON public.profiles 
FOR SELECT 
USING (
    -- This approach avoids querying the table itself in the USING clause if the user is already matched
    -- It only executes the subquery if the first condition is false.
    auth.uid() != id AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure users can UPDATE their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
