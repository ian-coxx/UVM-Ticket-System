# Testing Authentication - Debug Steps

## Check Terminal Logs

When you click the magic link, check your terminal where `npm run dev` is running. You should see logs like:
- "Auth callback called: ..."
- "User authenticated successfully: ..."
- "Profile check result: ..."

## If You See "Email link is invalid or has expired"

This error comes from Supabase BEFORE it reaches our callback route. This means:

1. **The magic link itself is being rejected by Supabase**
   - Check Supabase Dashboard → Authentication → Logs
   - Look for errors when you click the magic link
   - The error should show why it's being rejected

2. **Possible causes:**
   - Code already used (clicked twice)
   - Link expired (though you said it's fresh)
   - Redirect URL mismatch (but you confirmed it's set correctly)
   - Code parameter missing or malformed

## Manual Profile Creation (Quick Fix)

If the callback isn't running, you can manually create your profile:

```sql
INSERT INTO public.users (id, email, name, role, department)
VALUES (
    '128600ed-7304-4fd6-bbcc-f210e107f1fa',
    'ian.cox@uvm.edu',
    'ian.cox',
    'user',
    'student'
)
ON CONFLICT (id) DO NOTHING;
```

Then try accessing http://localhost:3000/tickets directly (you might already be authenticated).

## Check If You're Already Logged In

1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Look for cookies or localStorage
4. Check if there's a Supabase session

If you ARE logged in but the profile doesn't exist, the middleware might be blocking you.

## Next Steps

1. **Check terminal logs** - What do you see when clicking the magic link?
2. **Check Supabase Auth Logs** - What error is Supabase showing?
3. **Try manual profile creation** - Then access /tickets directly
4. **Share the terminal output** - So I can see what's happening








