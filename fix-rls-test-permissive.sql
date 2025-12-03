-- TEST: Most permissive policy possible
-- This will help us determine if it's a role issue or something else

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anon authenticated inserts" ON tickets;
DROP POLICY IF EXISTS "Allow authenticated ticket inserts" ON tickets;

-- Create a policy that allows ANY role to insert (for testing)
-- This is very permissive - we'll tighten it after we confirm it works
CREATE POLICY "Allow all inserts for testing" ON tickets
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Verify
SELECT policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'tickets' AND cmd = 'INSERT';


