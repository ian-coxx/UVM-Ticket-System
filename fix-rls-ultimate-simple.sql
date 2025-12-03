-- ULTIMATE SIMPLE FIX
-- Since even the simplest policies aren't working, let's try the absolute simplest

-- Re-enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop ALL policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tickets') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON tickets';
    END LOOP;
END $$;

-- Create the absolute simplest policy possible
-- No role restriction, no check - just allow inserts
CREATE POLICY "tickets_insert_policy" ON tickets
  FOR INSERT
  WITH CHECK (true);

-- Also try with USING instead of WITH CHECK (sometimes needed)
-- Actually, for INSERT, WITH CHECK is correct, but let's also ensure SELECT works
CREATE POLICY "tickets_select_policy" ON tickets
  FOR SELECT
  USING (true);

-- Verify
SELECT policyname, cmd, roles, with_check, qual
FROM pg_policies 
WHERE tablename = 'tickets'
ORDER BY cmd, policyname;


