-- Create delete_user RPC function
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the ID of the user making the request
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from profiles (if cascade delete is not set)
  DELETE FROM public.profiles WHERE id = v_user_id;
  
  -- Delete appointments
  DELETE FROM public.appointments WHERE user_id = v_user_id;

  -- Delete from auth.users (This requires postgres to have permission, usually auth.users delete is restricted)
  -- A cleaner way in Supabase is to just let the user delete their profile/data, or use a secure edge function.
  -- But if we want to delete from auth.users via RPC, it needs SECURITY DEFINER.
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
