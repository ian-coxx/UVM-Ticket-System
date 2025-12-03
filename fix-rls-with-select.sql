-- FIX: Create both INSERT and SELECT policies
-- The .select() after insert requires a SELECT policy too!

-- Re-enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tickets') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON tickets';
    END LOOP;
END $$;

-- Create INSERT policy
CREATE POLICY "Allow ticket inserts" ON tickets
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create SELECT policy (needed for .select() after insert!)
CREATE POLICY "Allow ticket selects" ON tickets
  FOR SELECT
  TO public
  USING (true);

-- Verify both were created
SELECT policyname, cmd, roles, with_check, qual
FROM pg_policies 
WHERE tablename = 'tickets'
ORDER BY cmd, policyname;


