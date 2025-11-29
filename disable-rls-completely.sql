-- COMPLETE RLS DISABLE - FOR TESTING ONLY
-- This will completely disable RLS to confirm that's the issue

-- Disable RLS completely
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'tickets';
-- Should show rls_enabled = false

-- After testing, if tickets work, re-enable with:
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

