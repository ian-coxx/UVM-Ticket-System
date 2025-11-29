-- FIX RLS Policy - Version 2 (More Permissive)
-- This version doesn't check userid match, just that user is authenticated

-- Step 1: Drop ALL existing INSERT policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tickets' AND cmd = 'INSERT') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON tickets';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 2: Create a very permissive INSERT policy
-- This allows ANY authenticated user to insert tickets
CREATE POLICY "Allow all authenticated inserts" ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 3: Verify it was created
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'tickets' AND cmd = 'INSERT';

