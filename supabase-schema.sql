-- UVM Ticket System Database Schema
-- Run this in your Supabase SQL Editor

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'staff')),
  department TEXT CHECK (department IN ('student', 'faculty', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create a SECURITY DEFINER function to check if user is staff
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_staff(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'staff'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Staff can view all users (uses function to avoid recursion)
CREATE POLICY "Staff can view all users" ON public.users
  FOR SELECT
  USING (public.is_staff(auth.uid()));

-- Policy: Allow insert for authenticated users (needed for trigger)
CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Function to create user profile on first login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_domain TEXT;
  user_role TEXT;
  user_department TEXT;
BEGIN
  user_email := NEW.email;
  user_domain := LOWER(SPLIT_PART(user_email, '@', 2));
  
  -- Only allow @uvm.edu emails
  IF user_domain != 'uvm.edu' THEN
    RAISE EXCEPTION 'Only @uvm.edu email addresses are allowed';
  END IF;
  
  -- Determine role (staff if email contains certain patterns, otherwise user)
  -- You can customize this logic
  IF user_email LIKE '%@uvm.edu' THEN
    user_role := 'user';
    user_department := 'student'; -- Default, can be updated
  END IF;
  
  -- Insert into public.users (with ON CONFLICT to prevent errors)
  INSERT INTO public.users (id, email, name, role, department)
  VALUES (
    NEW.id,
    user_email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(user_email, '@', 1)),
    user_role,
    user_department
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  operating_system TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('account_management', 'system_admin', 'classroom_tech', 'general')),
  department TEXT NOT NULL DEFAULT 'student' CHECK (department IN ('student', 'faculty', 'staff')),
  assigned_to TEXT,
  estimated_time INTEGER, -- in minutes
  ai_confidence INTEGER, -- 0-100
  ai_suggestions TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_urgency ON tickets(urgency);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert tickets
CREATE POLICY "Authenticated users can insert tickets" ON tickets
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      email = (SELECT email FROM public.users WHERE id = auth.uid())
      OR public.is_staff(auth.uid())
    )
  );

-- Policy: Staff can update tickets (uses function to avoid recursion)
CREATE POLICY "Staff can update tickets" ON tickets
  FOR UPDATE
  USING (public.is_staff(auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a function to notify n8n when ticket is created
-- This can be used with Supabase webhooks
CREATE OR REPLACE FUNCTION notify_ticket_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('ticket_created', json_build_object(
    'id', NEW.id,
    'title', NEW.title,
    'email', NEW.email,
    'status', NEW.status
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket creation notification
CREATE TRIGGER ticket_created_notification
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_created();

