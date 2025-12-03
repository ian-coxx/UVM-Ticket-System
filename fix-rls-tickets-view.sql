-- Fix RLS policy for tickets table to handle users created via signup
-- This ensures users can view their own tickets even if there are issues with users table lookup

-- First, let's check what policies currently exist
SELECT policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'tickets' AND cmd = 'SELECT';

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view own tickets or staff" ON tickets;
DROP POLICY IF EXISTS "Allow ticket selects" ON tickets;

-- Create a robust SELECT policy that:
-- 1. Allows users to see tickets where userid matches their auth.uid() (primary check)
-- 2. Allows staff to see all tickets (secondary check using SECURITY DEFINER function to avoid RLS issues)
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT
  TO public
  USING (
    -- Primary: Allow if userid matches authenticated user (works for all users)
    (userid IS NOT NULL AND userid = auth.uid())
    OR
    -- Secondary: Allow if user is staff (uses function to bypass RLS on users table)
    (auth.uid() IS NOT NULL AND public.is_staff(auth.uid()))
  );

-- Verify the policy was created
SELECT policyname, cmd, roles, qual
FROM pg_policies 
WHERE tablename = 'tickets' AND cmd = 'SELECT';

