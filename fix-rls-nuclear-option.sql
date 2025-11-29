-- NUCLEAR OPTION: Temporarily disable RLS to test
-- ONLY USE THIS FOR TESTING - NOT FOR PRODUCTION!
-- This will help us determine if RLS is the actual problem

-- Step 1: Disable RLS temporarily
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- After testing, if tickets work, then RLS is definitely the issue
-- Re-enable with: ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

