-- Complete Debugging Query
-- Run this to see everything about the tickets table

-- 1. Check ALL policies (not just INSERT)
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tickets'
ORDER BY cmd, policyname;

-- 2. Check if RLS is actually enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tickets';

-- 3. Check table structure - see what columns actually exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

-- 4. Check for any triggers that might be interfering
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'tickets';

-- 5. Check for foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'tickets' 
  AND tc.constraint_type = 'FOREIGN KEY';

