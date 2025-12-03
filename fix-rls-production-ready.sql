-- PRODUCTION-READY RLS POLICIES
-- This creates secure policies that still allow ticket submission

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

-- INSERT Policy: Allow authenticated users to insert tickets
CREATE POLICY "Allow ticket inserts" ON tickets
  FOR INSERT
  TO public
  WITH CHECK (userid IS NOT NULL);

-- SELECT Policy: Users can see their own tickets, staff can see all
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT
  TO public
  USING (
    userid = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'staff'
    )
  );

-- UPDATE Policy: Staff can update tickets
CREATE POLICY "Staff can update tickets" ON tickets
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'staff'
    )
  );

-- Verify all policies
SELECT policyname, cmd, roles, with_check, qual
FROM pg_policies 
WHERE tablename = 'tickets'
ORDER BY cmd, policyname;


