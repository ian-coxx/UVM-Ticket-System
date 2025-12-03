# Quick Setup Guide

## Step 1: Install Dependencies ✅
Dependencies have been installed!

## Step 2: Set Up Supabase

1. **Create a Supabase Project**:
   - Go to https://app.supabase.com
   - Sign up or log in
   - Click "New Project"
   - Fill in project details and wait for it to be created

2. **Get Your Supabase Credentials**:
   - Go to Settings → API
   - Copy the following:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - `anon` `public` key
     - `service_role` `secret` key (keep this secret!)

3. **Set Up the Database**:
   - Go to SQL Editor in Supabase
   - Click "New Query"
   - Copy and paste the entire contents of `supabase-schema.sql`
   - Click "Run" to execute the SQL
   - You should see "Success. No rows returned"

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the placeholder values with your actual Supabase credentials.

## Step 4: Run the Development Server

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Step 5: Test the Application

1. **Submit a Ticket**:
   - Go to http://localhost:3000/submit
   - Fill out the form and submit
   - Check Supabase Dashboard → Table Editor → tickets to see your ticket

2. **View Tickets**:
   - Go to http://localhost:3000/tickets
   - Enter the email you used to submit the ticket

3. **Staff Portal**:
   - Go to http://localhost:3000/staff
   - Password: `staff123` (for development only)

## Troubleshooting

- **"Missing Supabase environment variables" error**: Make sure `.env.local` exists and has correct values
- **Database errors**: Make sure you ran the SQL schema in Supabase
- **Can't see tickets**: Check Supabase RLS policies are set correctly







