-- Fix/Recreate the trigger function and trigger
-- Run this if the trigger isn't working

-- Drop and recreate the function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_domain TEXT;
BEGIN
  user_email := NEW.email;
  user_domain := LOWER(SPLIT_PART(user_email, '@', 2));
  
  -- Only allow @uvm.edu emails
  IF user_domain != 'uvm.edu' THEN
    RAISE EXCEPTION 'Only @uvm.edu email addresses are allowed';
  END IF;
  
  -- Insert into public.users (with ON CONFLICT to prevent errors)
  INSERT INTO public.users (id, email, name, role, department)
  VALUES (
    NEW.id,
    user_email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(user_email, '@', 1)),
    'user',
    'student'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- If you already have users in auth.users but not in public.users, create them manually
-- Uncomment and run this if needed (replace with actual user emails):
/*
INSERT INTO public.users (id, email, name, role, department)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)),
    'user',
    'student'
FROM auth.users
WHERE email LIKE '%@uvm.edu'
ON CONFLICT (id) DO NOTHING;
*/


