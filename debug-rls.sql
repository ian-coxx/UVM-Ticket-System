-- Debug RLS Policies for Tickets Table
-- Run this to see what policies exist and diagnose the issue

-- 1. Check all policies on tickets table
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

-- 3. Check current user context (run this while logged in)
-- This will show what auth.uid() returns
SELECT auth.uid() as current_user_id;


