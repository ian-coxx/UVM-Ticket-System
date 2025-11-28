# Database Setup Instructions

## ✅ Environment Variables Configured

Your `.env.local` file has been created with your Supabase credentials.

## Next Step: Run the Database Schema

You need to run the SQL schema in your Supabase project to create the tickets table.

### Steps:

1. **Open Supabase Dashboard**:
   - Go to https://app.supabase.com
   - Select your project: `kvgnqchbjcjsnzlyylih`

2. **Open SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Schema**:
   - Open the file `supabase-schema.sql` from this project
   - Copy ALL the contents (it's about 85 lines)
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify**:
   - You should see "Success. No rows returned"
   - Go to "Table Editor" in the left sidebar
   - You should see a `tickets` table

### What the Schema Creates:

- ✅ `tickets` table with all required fields
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic timestamp updates
- ✅ Notification triggers for n8n integration

## After Running the Schema

Once the schema is run, restart your dev server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

Then test the app:
1. Go to http://localhost:3000/submit
2. Submit a test ticket
3. Check Supabase Table Editor to see your ticket
4. Go to http://localhost:3000/staff (password: `staff123`) to manage tickets

## Troubleshooting

**"relation 'tickets' does not exist" error:**
- Make sure you ran the SQL schema
- Check that the `tickets` table exists in Table Editor

**"permission denied" errors:**
- The RLS policies should allow all operations for now
- If issues persist, check the policies in Supabase Dashboard → Authentication → Policies



