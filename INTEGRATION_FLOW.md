# Integration Flow: Frontend → Supabase → n8n

## Overview

This document explains how tickets flow through the system from user submission to n8n processing.

## Current Flow (Recommended)

```
User submits ticket
    ↓
Frontend stores ticket in Supabase (with default values)
    ↓
Supabase webhook triggers n8n workflow
    ↓
n8n processes ticket (AI classification, urgency, etc.)
    ↓
n8n updates ticket in Supabase with processed data
    ↓
Frontend shows updated ticket (real-time via Supabase subscriptions)
```

## Why This Approach?

### ✅ Benefits:
1. **Reliability**: Tickets are never lost, even if n8n is down
2. **User Experience**: Users get immediate confirmation
3. **Resilience**: Works even if frontend fails after submission
4. **Audit Trail**: All tickets are stored before processing
5. **Asynchronous Processing**: n8n can take time without blocking users

### 📋 Default Values:
When a ticket is first created, it has:
- `userid`: Authenticated user's UUID
- `operating_system`: From form
- `issue_description`: From form
- `category`: 'General' (default, updated by n8n)
- Other fields: Set by n8n after processing

## n8n Workflow Responsibilities

Your n8n workflow should:

1. **Receive webhook** from Supabase when ticket is created
2. **Process ticket**:
   - Classify urgency (low/medium/high/critical)
   - Classify category (Account Management/System Admin/etc.)
   - Generate AI suggestions
   - Determine department if needed
3. **Update ticket** in Supabase with processed data:
   ```sql
   UPDATE tickets 
   SET 
     urgency = 'high',
     category = 'Account Management',
     ai_suggestions = '...',
     -- other processed fields
   WHERE id = <ticket_id>
   ```

## Supabase Webhook Setup

1. Go to Supabase Dashboard → Database → Webhooks
2. Create webhook:
   - **Name**: "Ticket Created → n8n"
   - **Table**: `tickets`
   - **Events**: `INSERT`
   - **Webhook URL**: Your n8n webhook URL
   - **HTTP Method**: `POST`

## What Gets Sent to n8n

When a ticket is created, Supabase sends:
```json
{
  "type": "INSERT",
  "table": "tickets",
  "record": {
    "id": "uuid",
    "userid": "user-uuid",
    "operating_system": "macOS",
    "issue_description": "User's description...",
    "category": "General",
    "created_at": "2025-11-29T..."
  }
}
```

## RLS Policy

The RLS policy ensures:
- Only authenticated users can insert tickets
- Users can only create tickets with their own `userid`
- Staff can view/update all tickets

Run `fix-rls-policy.sql` in Supabase SQL Editor to set this up.

## Alternative Approach (Not Recommended)

**Frontend → n8n directly**:
- ❌ Tickets lost if n8n is down
- ❌ Users wait for n8n processing
- ❌ Complex error handling
- ❌ No audit trail if n8n fails

## Next Steps

1. ✅ Fix RLS policy (run `fix-rls-policy.sql`)
2. ✅ Test ticket submission
3. ⏳ Set up Supabase webhook to n8n
4. ⏳ Configure n8n to update tickets after processing



