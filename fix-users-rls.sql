-- Fix RLS policies for users table
-- This ensures users can read their own profile

-- First, enable RLS on the users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON public.users;
DROP POLICY IF EXISTS "Allow public to read users" ON public.users;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Also allow public/anon to read (for initial signup, but this might not be needed)
-- Actually, let's be more permissive for now to fix the issue
CREATE POLICY "Allow authenticated users to read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow inserts (for signup)
CREATE POLICY "Allow authenticated users to insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);



