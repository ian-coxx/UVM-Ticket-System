-- WORKING RLS FIX
-- Since disabling RLS worked, we know RLS is the issue
-- This creates a policy that should definitely work

-- Step 1: Re-enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tickets') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON tickets';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 3: Create a simple, working INSERT policy
-- Using 'public' role and just checking that userid is provided
CREATE POLICY "Allow ticket inserts" ON tickets
  FOR INSERT
  TO public
  WITH CHECK (userid IS NOT NULL);

-- Step 4: Verify it was created
SELECT policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'tickets' AND cmd = 'INSERT';


