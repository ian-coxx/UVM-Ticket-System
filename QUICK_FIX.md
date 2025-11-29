# Quick Fix for Auth Issues

## Issue 1: Magic Link Expired

The error `otp_expired` means the magic link expired. Magic links typically expire after 1 hour.

**Solution**: Request a new magic link from the login page.

## Issue 2: User Table Missing

The `users` table needs to be created in Supabase.

### Steps to Fix:

1. **Open Supabase SQL Editor**:
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Run the User Table SQL**:
   - Open the file `USER_TABLE_SETUP.sql` from this project
   - Copy ALL the SQL code
   - Paste it into the Supabase SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

3. **Verify the Table Was Created**:
   - Go to "Table Editor" in Supabase
   - You should now see a `users` table in the list

4. **Configure Supabase Auth Redirect URL**:
   - Go to Authentication → URL Configuration
   - Under "Redirect URLs", add:
     - `http://localhost:3000/auth/callback`
     - (For production, add your production URL too)
   - Click "Save"

5. **Try Logging In Again**:
   - Go to http://localhost:3000/login
   - Enter your @uvm.edu email
   - Check your email for a NEW magic link
   - Click the link (make sure to use it within 1 hour)

## If You Still Have Issues:

1. **Check Supabase Auth Logs**:
   - Go to Authentication → Logs
   - Look for any errors when you click the magic link

2. **Verify Email Domain**:
   - Make sure you're using a @uvm.edu email
   - The trigger function will reject non-UVM emails

3. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Check the Console tab for any errors
   - Check the Network tab to see if requests are failing

4. **Manual User Creation (if needed)**:
   If the trigger isn't working, you can manually create a user:
   ```sql
   -- First, get your user ID from auth.users
   SELECT id, email FROM auth.users WHERE email = 'your.email@uvm.edu';
   
   -- Then insert into public.users (replace UUID with your actual user ID)
   INSERT INTO public.users (id, email, name, role, department)
   VALUES (
     'your-user-id-here',
     'your.email@uvm.edu',
     'Your Name',
     'user',
     'student'
   );
   ```

## Making Someone Staff:

After they've logged in and have a user record:

```sql
UPDATE public.users 
SET role = 'staff' 
WHERE email = 'their.email@uvm.edu';
```





