# Fix: "Email link is invalid or has expired"

This error usually means the redirect URL in the magic link doesn't match what's configured in Supabase.

## Quick Fix Steps:

### 1. Check Supabase Redirect URL Configuration

1. **Go to Supabase Dashboard**:
   - Open your project: https://app.supabase.com
   - Click on **Authentication** in the left sidebar
   - Click on **URL Configuration**

2. **Add/Verify Redirect URLs**:
   - Under **"Redirect URLs"**, you should see a list
   - Make sure this EXACT URL is in the list:
     ```
     http://localhost:3000/auth/callback
     ```
   - If it's NOT there:
     - Click **"Add URL"** or the **+** button
     - Enter: `http://localhost:3000/auth/callback`
     - Click **Save**

3. **Also Check Site URL**:
   - Under **"Site URL"**, make sure it's set to:
     ```
     http://localhost:3000
     ```
   - If not, update it and click **Save**

### 2. Request a NEW Magic Link

After updating the redirect URL:
1. Go to http://localhost:3000/login
2. Enter your @uvm.edu email
3. Click "Send Magic Link"
4. Check your email for a NEW magic link
5. Click the new link (it should work now)

### 3. Verify the Magic Link URL

When you click the magic link in your email, it should look like:
```
http://localhost:3000/auth/callback?code=...&type=magiclink
```

If it looks different or goes to a different URL, that's the problem.

## Common Issues:

### Issue 1: Redirect URL Not Added
- **Symptom**: Link says "invalid or expired" immediately
- **Fix**: Add `http://localhost:3000/auth/callback` to Redirect URLs in Supabase

### Issue 2: Site URL Mismatch
- **Symptom**: Link redirects to wrong domain
- **Fix**: Set Site URL to `http://localhost:3000` in Supabase

### Issue 3: HTTPS vs HTTP
- **Symptom**: Link uses `https://` but you're on `http://`
- **Fix**: Make sure both use `http://` for localhost

### Issue 4: Trailing Slash
- **Symptom**: URL has or doesn't have trailing slash
- **Fix**: Make sure redirect URL is exactly: `http://localhost:3000/auth/callback` (no trailing slash)

## Still Not Working?

1. **Check Supabase Auth Logs**:
   - Go to Authentication → Logs
   - Look for errors when you click the magic link
   - Check what URL it's trying to redirect to

2. **Check Browser Console**:
   - Open DevTools (F12)
   - Go to Network tab
   - Click the magic link
   - See what request fails and what error it shows

3. **Try Manual Code Exchange** (for debugging):
   - Copy the `code` parameter from the magic link URL
   - The callback route should handle it, but you can check server logs

## Production Note:

When you deploy to production, you'll need to:
1. Add your production URL to Redirect URLs (e.g., `https://yourdomain.com/auth/callback`)
2. Update Site URL to your production domain
3. Update the `emailRedirectTo` in the code if needed








