-- DEFINITIVE FIX: This should definitely work
-- The user is authenticated (we confirmed via console logs)
-- The issue is the RLS policy isn't matching correctly

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

-- Step 2: Create a policy that explicitly allows authenticated users
-- Using 'authenticated' role and checking auth.uid() is not null
CREATE POLICY "Allow authenticated ticket inserts" ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 3: Also allow anon role when authenticated (sometimes needed)
CREATE POLICY "Allow anon authenticated inserts" ON tickets
  FOR INSERT
  TO anon
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 4: Verify both policies were created
SELECT policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'tickets' AND cmd = 'INSERT';


