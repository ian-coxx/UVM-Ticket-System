# n8n Integration Guide

This document explains how to connect your Next.js web app with n8n workflows.

## Architecture Overview

```
Frontend (Next.js) 
    ↓
Supabase (Database)
    ↓
n8n Workflows (via Webhooks/Triggers)
    ↓
Supabase (Updates)
    ↓
Frontend (Real-time updates)
```

## Connection Methods

### Method 1: Supabase Database Webhooks → n8n (RECOMMENDED)

This is the most reliable method. Supabase automatically sends webhooks to n8n when database events occur.

#### Setup Steps:

1. **Create n8n Webhook Node**:
   - In n8n, create a new workflow
   - Add a "Webhook" node
   - Set HTTP Method to `POST`
   - Set Path to something like `/ticket-webhook`
   - Click "Listen for Test Event" to get the webhook URL
   - Copy the webhook URL (e.g., `https://your-n8n-instance.com/webhook/ticket-webhook`)

2. **Configure Supabase Webhook**:
   - Go to Supabase Dashboard → Database → Webhooks
   - Click "Create a new webhook"
   - Name: "Ticket Created/Updated"
   - Table: `tickets`
   - Events: Select `INSERT` and `UPDATE`
   - Webhook URL: Paste your n8n webhook URL
   - HTTP Method: `POST`
   - HTTP Headers: (optional) Add authentication if needed
   - Save the webhook

3. **Process in n8n**:
   - The webhook node will receive data in this format:
   ```json
   {
     "type": "INSERT", // or "UPDATE"
     "table": "tickets",
     "record": {
       "id": "uuid",
       "title": "...",
       "description": "...",
       "email": "...",
       // ... all ticket fields
     },
     "old_record": null // or previous values for UPDATE
   }
   ```

4. **Add Supabase Node in n8n**:
   - After processing (AI classification, etc.), use a Supabase node to update the ticket
   - Configure with your Supabase credentials
   - Use "Update" operation
   - Filter by ID: `{{ $json.record.id }}`
   - Update fields: urgency, category, ai_suggestions, etc.

### Method 2: Frontend → n8n Direct Webhook

The frontend can directly call n8n webhooks when tickets are created.

#### Setup:

1. **Create n8n Webhook**:
   - Add a "Webhook" node in n8n
   - Get the webhook URL

2. **Add to Environment Variables**:
   ```env
   NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/ticket-created
   ```

3. **Already Implemented**:
   - The `TicketForm.tsx` component already calls this webhook after ticket creation
   - See line ~50 in `components/TicketForm.tsx`

### Method 3: n8n → Frontend API Endpoint

n8n can call your Next.js API endpoint to update tickets.

#### Setup:

1. **API Endpoint**: Already created at `/api/webhooks/n8n`

2. **From n8n**:
   - Add an "HTTP Request" node
   - Method: `POST`
   - URL: `https://your-app-url.com/api/webhooks/n8n`
   - Body:
   ```json
   {
     "event": "ticket.updated",
     "ticketId": "{{ $json.ticket.id }}",
     "updates": {
       "urgency": "high",
       "category": "system_admin",
       "ai_suggestions": "Try restarting your computer...",
       "ai_confidence": 85
     }
   }
   ```

### Method 4: n8n Polling Supabase

n8n can periodically check for new tickets.

#### Setup:

1. **Add Cron Node**:
   - Runs every minute (or your preferred interval)

2. **Add Supabase Node**:
   - Operation: "Get Many"
   - Filter: `status.eq.open,created_at.gte.{{ $now.minus({minutes: 5}) }}`
   - This gets tickets created in the last 5 minutes

3. **Process and Update**:
   - Process each ticket
   - Update back to Supabase

## Recommended n8n Workflow Structure

### Workflow 1: Ticket Processing Pipeline

```
1. Webhook (from Supabase) 
   ↓
2. IF Node: Check if type == "INSERT"
   ↓
3. AI/LLM Node: Classify urgency
   ↓
4. AI/LLM Node: Classify category
   ↓
5. AI/LLM Node: Classify department
   ↓
6. AI/LLM Node: Generate troubleshooting tips (if confidence > 80%)
   ↓
7. Pinecone Node: Query similar past tickets
   ↓
8. Supabase Node: Update ticket with all classifications
   ↓
9. Email Node: Send automated response to user
```

### Workflow 2: Ticket Update Notifications

```
1. Webhook (from Supabase)
   ↓
2. IF Node: Check if status changed
   ↓
3. Email Node: Send notification to user
```

### Workflow 3: Urgent Ticket Alerts

```
1. Webhook (from Supabase)
   ↓
2. IF Node: Check if urgency == "critical"
   ↓
3. Email/Slack Node: Alert team
```

## n8n Supabase Node Configuration

When using Supabase nodes in n8n:

1. **Connection**:
   - Host: Your Supabase project URL (without https://)
   - Service Role Secret: Your `SUPABASE_SERVICE_ROLE_KEY`
   - Database: `postgres`
   - Port: `5432`
   - User: `postgres`
   - Password: Your database password (from Supabase Settings → Database)

2. **Operations**:
   - **Get Many**: Query tickets
   - **Update**: Update ticket fields
   - **Insert**: Create new records (if needed)

## Testing the Integration

1. **Test Webhook from Supabase**:
   - Submit a ticket from the frontend
   - Check n8n workflow execution logs
   - Verify data is received correctly

2. **Test n8n → Supabase Update**:
   - Manually trigger your n8n workflow
   - Check Supabase dashboard to see if ticket was updated
   - Check frontend to see if real-time update appears

3. **Test Full Flow**:
   - Submit ticket → Supabase → n8n processes → Updates Supabase → Frontend updates

## Troubleshooting

### Webhook not receiving data:
- Check Supabase webhook logs (Database → Webhooks → View logs)
- Verify n8n webhook URL is correct and accessible
- Check n8n workflow is active

### Updates not appearing in frontend:
- Verify Supabase real-time subscriptions are working
- Check browser console for errors
- Verify RLS policies allow updates

### n8n can't connect to Supabase:
- Verify credentials are correct
- Check if IP is whitelisted in Supabase (if using IP restrictions)
- Use service role key, not anon key for admin operations

## Security Considerations

1. **Webhook Authentication**:
   - Add authentication headers to Supabase webhooks
   - Verify in n8n webhook node

2. **API Endpoint Security**:
   - Add authentication to `/api/webhooks/n8n`
   - Consider using API keys or JWT tokens

3. **Supabase RLS**:
   - Ensure Row Level Security policies are properly configured
   - Use service role key only in n8n (server-side)

## Example n8n Workflow JSON

You can import this into n8n to get started:

```json
{
  "name": "Ticket Processing",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ticket-webhook",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.type }}",
              "operation": "equal",
              "value2": "INSERT"
            }
          ]
        }
      },
      "name": "Check if New Ticket",
      "type": "n8n-nodes-base.if",
      "position": [450, 300]
    },
    {
      "parameters": {
        "operation": "update",
        "table": "tickets",
        "updateKey": "id",
        "columns": {
          "urgency": "={{ $json.urgency }}",
          "category": "={{ $json.category }}",
          "ai_suggestions": "={{ $json.suggestions }}"
        }
      },
      "name": "Update Ticket",
      "type": "n8n-nodes-base.supabase",
      "position": [650, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Check if New Ticket", "type": "main", "index": 0}]]
    },
    "Check if New Ticket": {
      "main": [[{"node": "Update Ticket", "type": "main", "index": 0}]]
    }
  }
}
```

## Next Steps

1. Set up your n8n instance (cloud or self-hosted)
2. Create the webhook endpoints
3. Configure Supabase webhooks
4. Build your AI classification workflows
5. Test end-to-end flow
6. Deploy and monitor







