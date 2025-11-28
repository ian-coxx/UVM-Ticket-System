# Authentication Setup Guide

## ✅ What's Been Implemented

1. **User Table** - Created in database schema
2. **Email Magic Link Authentication** - Using Supabase Auth
3. **@uvm.edu Email Validation** - Only UVM emails allowed
4. **Auto User Creation** - Users are created in `users` table on first login
5. **Role-Based Access** - Staff vs regular users
6. **Protected Routes** - Middleware protects `/staff` and `/tickets` routes

## Database Setup

Run the updated `supabase-schema.sql` in your Supabase SQL Editor. This will:
- Create the `users` table
- Set up triggers to auto-create user profiles on first login
- Enforce @uvm.edu email validation
- Set up proper RLS policies

## Supabase Auth Configuration

1. **Enable Email Auth**:
   - Go to Supabase Dashboard → Authentication → Providers
   - Make sure "Email" is enabled
   - Configure email templates if needed

2. **Set Up Email Redirects**:
   - Go to Authentication → URL Configuration
   - Add to "Redirect URLs": `http://localhost:3000/auth/callback`
   - For production, add your production URL

3. **Email Domain Restriction** (Optional):
   - The app validates @uvm.edu in code
   - You can also restrict in Supabase Dashboard → Authentication → Settings
   - Add "uvm.edu" to allowed email domains

## How It Works

### For Users:
1. User goes to `/login`
2. Enters their @uvm.edu email
3. Receives magic link via email
4. Clicks link → redirected to `/auth/callback`
5. User profile is automatically created in `users` table
6. User is signed in and can access `/tickets`

### For Staff:
1. Staff member signs in with @uvm.edu email
2. User profile is created with `role = 'user'` by default
3. **To make someone staff**: Update their role in Supabase:
   ```sql
   UPDATE public.users 
   SET role = 'staff' 
   WHERE email = 'staff.member@uvm.edu';
   ```
4. Staff can then access `/staff` portal

## Making Someone a Staff Member

### Option 1: Via Supabase Dashboard
1. Go to Table Editor → `users`
2. Find the user
3. Edit their `role` field to `staff`
4. Save

### Option 2: Via SQL
```sql
UPDATE public.users 
SET role = 'staff' 
WHERE email = 'their.email@uvm.edu';
```

## Testing

1. **Test User Login**:
   - Go to http://localhost:3000/login
   - Enter a @uvm.edu email
   - Check email for magic link
   - Click link to sign in
   - Should redirect to home page

2. **Test Staff Access**:
   - Sign in with a @uvm.edu email
   - Update that user's role to 'staff' in Supabase
   - Go to http://localhost:3000/staff
   - Should see staff dashboard

3. **Test Protected Routes**:
   - Try accessing `/staff` without signing in
   - Should redirect to `/login`
   - Try accessing `/tickets` without signing in
   - Should redirect to `/login`

## Troubleshooting

**"Only @uvm.edu email addresses are allowed" error:**
- Make sure you're using a @uvm.edu email
- Check the email validation in the login form

**User not created in users table:**
- Check Supabase logs for trigger errors
- Verify the trigger function exists: `handle_new_user()`
- Check RLS policies allow inserts

**Can't access staff portal:**
- Verify user's role is set to 'staff' in `users` table
- Check middleware is checking role correctly
- Look at browser console for errors

**Magic link not working:**
- Check Supabase email settings
- Verify redirect URL is configured
- Check spam folder
- Look at Supabase Auth logs

## Next Steps

- [ ] Set up email templates in Supabase
- [ ] Add user profile editing
- [ ] Add ability to promote users to staff from UI (admin only)
- [ ] Add department auto-detection based on email patterns
- [ ] Add user avatar/profile pictures



