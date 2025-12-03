-- SIMPLE FIX: RLS Policy for Tickets Table
-- Run this in Supabase SQL Editor if the other fix doesn't work

-- Drop ALL existing INSERT policies on tickets table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tickets' AND cmd = 'INSERT') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON tickets';
    END LOOP;
END $$;

-- Create simple INSERT policy: any authenticated user can insert
CREATE POLICY "Allow authenticated users to insert tickets" ON tickets
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);


