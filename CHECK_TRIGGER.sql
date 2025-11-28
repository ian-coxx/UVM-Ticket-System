-- Check if the trigger and function exist
-- Run this in Supabase SQL Editor to verify everything is set up

-- Check if the function exists
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check if the trigger exists
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as is_enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Check if there are any users in auth.users but not in public.users
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    pu.id as profile_exists
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

