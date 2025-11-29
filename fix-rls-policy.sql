-- Fix RLS Policy for Tickets Table
-- Run this in Supabase SQL Editor to allow authenticated users to insert tickets

-- First, let's see what policies currently exist (for debugging)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'tickets';

-- Drop ALL existing INSERT policies on tickets table (in case names are different)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tickets' AND cmd = 'INSERT') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON tickets';
    END LOOP;
END $$;

-- Create new INSERT policy that allows authenticated users to insert tickets
-- where userid matches their auth.uid() (ensures users can only create tickets for themselves)
CREATE POLICY "Authenticated users can insert tickets" ON tickets
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND userid = auth.uid());

-- Verify the policy was created
-- SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'tickets' AND cmd = 'INSERT';

