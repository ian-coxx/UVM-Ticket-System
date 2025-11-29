-- Check what policies actually exist on tickets table
-- Run this to see the current state

-- 1. Check ALL policies on tickets table
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tickets'
ORDER BY cmd, policyname;

-- 2. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tickets';

-- 3. Check table structure to see what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

