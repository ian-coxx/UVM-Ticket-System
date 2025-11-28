-- Reset your auth user to test the full signup flow
-- Run this to delete your existing auth user, then sign in again to test the trigger

-- First, delete from public.users if it exists (though it shouldn't based on your check)
DELETE FROM public.users WHERE email = 'ian.cox@uvm.edu';

-- Delete from auth.users (this will cascade delete from public.users if it existed)
-- Note: You need to use Supabase's admin API or dashboard for this
-- Go to: Authentication → Users → Find your user → Delete

-- OR use this SQL (requires superuser/admin access):
-- DELETE FROM auth.users WHERE email = 'ian.cox@uvm.edu';

-- After deleting, the trigger should fire when you sign in again

