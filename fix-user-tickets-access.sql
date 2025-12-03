-- Fix for users created via signup not being able to view tickets
-- This script ensures RLS policies work correctly for all users

-- Step 1: Verify user profiles exist for Colin and Ben
-- Run this first to check:
SELECT 
  u.id,
  u.email,
  u.role,
  COUNT(t.id) as ticket_count
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
LEFT JOIN tickets t ON t.userid = u.id
WHERE u.email IN (
  -- Replace with Colin and Ben's actual emails
  'colin.email@uvm.edu',
  'ben.email@uvm.edu'
)
GROUP BY u.id, u.email, u.role, pu.id;

-- Step 2: If user profiles are missing, create them
-- Replace the emails and IDs with actual values from Step 1
-- INSERT INTO public.users (id, email, name, role, department)
-- SELECT 
--   id,
--   email,
--   COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)),
--   'user',
--   'student'
-- FROM auth.users
-- WHERE email IN ('colin.email@uvm.edu', 'ben.email@uvm.edu')
-- AND id NOT IN (SELECT id FROM public.users);

-- Step 3: Fix RLS policy on tickets table to be more robust
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;

-- Create policy that works even if users table lookup fails
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT
  TO public
  USING (
    -- Primary check: userid matches authenticated user (works for all users)
    (userid IS NOT NULL AND userid = auth.uid())
    OR
    -- Secondary check: user is staff (uses SECURITY DEFINER function)
    (auth.uid() IS NOT NULL AND public.is_staff(auth.uid()))
  );

-- Step 4: Verify the policy
SELECT 
  policyname, 
  cmd, 
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as has_using
FROM pg_policies 
WHERE tablename = 'tickets' AND cmd = 'SELECT';

-- Step 5: Test query (run as one of the affected users)
-- This should return their tickets:
-- SELECT * FROM tickets WHERE userid = auth.uid();

