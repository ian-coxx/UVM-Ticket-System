# Debugging Authentication Issues

Since your redirect URL is configured correctly, let's check a few other things:

## 1. Check if Users Table Exists

The most likely issue is that the `users` table doesn't exist yet. When the auth trigger tries to create a user profile, it fails if the table is missing.

**Check in Supabase:**
1. Go to Table Editor
2. Look for a table called `users` in the `public` schema
3. If it's NOT there, you need to run the SQL schema

**Fix:**
- Open `USER_TABLE_SETUP.sql` 
- Copy all the SQL
- Run it in Supabase SQL Editor

## 2. Check Server Logs

The callback route now has better logging. Check your terminal where `npm run dev` is running to see:
- What error is happening
- Whether the code exchange is working
- If user profile creation is failing

## 3. Check Supabase Auth Logs

1. Go to Supabase Dashboard → Authentication → Logs
2. Look for entries when you click the magic link
3. Check what errors are being logged

## 4. Test the Magic Link Directly

When you click the magic link, check:
1. What URL does it redirect to?
2. Does it have a `code` parameter?
3. Does it have an `error` parameter?

The URL should look like:
```
http://localhost:3000/auth/callback?code=abc123...&type=magiclink
```

If it has `error=` instead, that's the problem.

## 5. Common Issues

### Issue: Users Table Missing
- **Symptom**: Auth works but user profile creation fails
- **Fix**: Run `USER_TABLE_SETUP.sql` in Supabase

### Issue: Trigger Function Failing
- **Symptom**: User created in auth.users but not in public.users
- **Fix**: Check trigger function exists and is working
- **Manual Fix**: You can manually create the user profile:
  ```sql
  INSERT INTO public.users (id, email, name, role, department)
  VALUES (
    (SELECT id FROM auth.users WHERE email = 'your.email@uvm.edu'),
    'your.email@uvm.edu',
    'Your Name',
    'user',
    'student'
  );
  ```

### Issue: Code Already Used
- **Symptom**: "code already used" error
- **Fix**: Request a fresh magic link

### Issue: Email Domain Validation
- **Symptom**: Trigger rejects non-@uvm.edu emails
- **Fix**: Make sure you're using a @uvm.edu email

## Next Steps

1. **Run the users table SQL** if you haven't already
2. **Check your terminal logs** when clicking the magic link
3. **Check Supabase Auth Logs** for detailed error messages
4. **Share the error message** you see in the terminal or Supabase logs








