-- Verify the trigger exists and is enabled
-- Run this to check if everything is set up correctly

-- 1. Check if the function exists
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Check if the trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    CASE tgenabled 
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        ELSE 'Unknown'
    END as status,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 3. Check recent users in auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if those users have profiles
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    pu.id as profile_id,
    pu.role as profile_role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 5;

