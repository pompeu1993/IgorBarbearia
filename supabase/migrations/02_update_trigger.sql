CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, cpf)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'cpf'
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- If there's an error inserting into profiles (e.g. duplicate CPF), still allow the user to be created or handle it gracefully
    -- Raising an exception here causes the 500 error on sign up
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;