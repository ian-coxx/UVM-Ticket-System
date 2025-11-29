-- FINAL FIX: More Robust RLS Policy
-- This version handles edge cases and ensures it works

-- Step 1: Drop the existing policy
DROP POLICY IF EXISTS "Allow authenticated users to insert tickets" ON tickets;

-- Step 2: Create a policy that explicitly allows authenticated role
-- Using 'authenticated' role ensures it works with Supabase Auth
CREATE POLICY "Allow authenticated users to insert tickets" ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 3: Also ensure the policy works for the anon role with auth check
-- (Sometimes needed for client-side inserts)
CREATE POLICY "Allow authenticated inserts via anon" ON tickets
  FOR INSERT
  TO anon
  WITH CHECK (auth.uid() IS NOT NULL);

-- Step 4: Verify both policies were created
SELECT policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'tickets' AND cmd = 'INSERT';

