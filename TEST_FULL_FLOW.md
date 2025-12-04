# Testing the Full Authentication Flow

Since you want to test the real flow, we need to reset your auth user so the trigger fires when you sign in again.

## Step 1: Delete Your Existing Auth User

The trigger only fires on INSERT, so since you're already in `auth.users`, it won't fire again. We need to delete you and sign in fresh.

**Option A: Via Supabase Dashboard (Easiest)**
1. Go to Supabase Dashboard → Authentication → Users
2. Find `ian.cox@uvm.edu`
3. Click the three dots (⋯) → Delete
4. Confirm deletion

**Option B: Via SQL (if you have admin access)**
Run in Supabase SQL Editor:
```sql
DELETE FROM auth.users WHERE email = 'ian.cox@uvm.edu';
```

## Step 2: Verify Trigger is Set Up

Make sure you've run `FIX_TRIGGER.sql` so the trigger function exists and is attached.

## Step 3: Request a New Magic Link

1. Go to http://localhost:3000/login
2. Enter `ian.cox@uvm.edu`
3. Click "Send Magic Link"
4. Check your email for the NEW magic link

## Step 4: Click the Magic Link

1. Click the magic link in your email
2. **Check your terminal** where `npm run dev` is running
   - You should see: "Auth callback called: ..."
   - Then: "User authenticated successfully: ..."
   - Then: "User profile not found, creating..." (if trigger didn't fire)
   - Or the trigger should have already created it

## Step 5: Verify Profile Was Created

1. Go to Supabase → Table Editor → `users` table
2. You should see your profile there
3. If not, check the terminal logs to see what error occurred

## Troubleshooting

**If the magic link still says "invalid or expired":**
- Check Supabase → Authentication → Logs
- Look for the error when you click the link
- The callback route has detailed logging - check terminal

**If profile isn't created:**
- Check terminal logs for errors
- The callback route will try to create it if the trigger fails
- Check if there are RLS policy issues

**If trigger doesn't fire:**
- Verify trigger exists: Run `CHECK_TRIGGER.sql`
- The callback route will create the profile as a fallback







