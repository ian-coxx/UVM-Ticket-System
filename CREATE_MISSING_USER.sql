-- Create the missing user profile for the existing auth user
-- Run this to fix the current user

INSERT INTO public.users (id, email, name, role, department)
VALUES (
    '128600ed-7304-4fd6-bbcc-f210e107f1fa',
    'ian.cox@uvm.edu',
    'ian.cox',
    'user',
    'student'
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    updated_at = NOW();


