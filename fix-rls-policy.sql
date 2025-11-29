-- Fix RLS Policy for Tickets Table
-- Run this in Supabase SQL Editor to allow authenticated users to insert tickets

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON tickets;

-- Create new INSERT policy that allows authenticated users to insert tickets
-- where userid matches their auth.uid() (ensures users can only create tickets for themselves)
CREATE POLICY "Authenticated users can insert tickets" ON tickets
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND userid = auth.uid());

-- Alternative: If you want to allow any authenticated user to insert (less secure)
-- Uncomment the line below and comment out the policy above
-- CREATE POLICY "Authenticated users can insert tickets" ON tickets
--   FOR INSERT
--   WITH CHECK (auth.uid() IS NOT NULL);

