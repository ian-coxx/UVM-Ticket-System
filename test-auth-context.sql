-- Test Auth Context and RLS Status
-- Run this to diagnose why RLS is blocking inserts

-- 1. Check if RLS is enabled on tickets table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tickets';

-- 2. Check what auth.uid() returns (should return NULL in SQL editor, but should work in app)
SELECT auth.uid() as current_user_id;

-- 3. Check ALL policies on tickets table (not just INSERT)
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tickets'
ORDER BY cmd, policyname;

-- 4. Try to see if there are any conflicting policies
-- Sometimes multiple policies can conflict


