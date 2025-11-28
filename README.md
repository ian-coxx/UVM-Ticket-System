# UVM Ticket System

A modern ticketing system for UVM IT support, built with Next.js, Supabase, and integrated with n8n workflows.

## Features

- **Ticket Submission**: Users can submit tickets via a web form
- **Ticket Viewing**: Users can view their submitted tickets
- **Staff Dashboard**: Technicians can view, manage, and reassign tickets
- **Real-time Updates**: Tickets update in real-time using Supabase subscriptions
- **n8n Integration**: Webhooks and database triggers connect to n8n workflows

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database)
- **Workflow Automation**: n8n
- **Form Validation**: React Hook Form + Zod

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Get your project URL and anon key from Settings > API
4. Get your service role key from Settings > API (keep this secret!)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_N8N_WEBHOOK_URL=your_n8n_webhook_url
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Connecting with n8n

There are multiple ways to connect your web app with n8n:

### Method 1: Supabase Webhooks → n8n (Recommended)

1. **Set up Supabase Webhook**:
   - In Supabase Dashboard, go to Database > Webhooks
   - Create a new webhook for the `tickets` table
   - Set the webhook URL to your n8n webhook endpoint
   - Choose events: INSERT, UPDATE

2. **Create n8n Workflow**:
   - Add a "Webhook" node to receive data from Supabase
   - Configure it to accept POST requests
   - Add a "Supabase" node to read/write data
   - Process the ticket data (classify urgency, category, etc.)
   - Use another "Supabase" node to update the ticket with AI suggestions

### Method 2: Direct HTTP Requests from Frontend

The frontend can directly call n8n webhooks when tickets are created/updated:

```typescript
// Already implemented in TicketForm.tsx
fetch(n8nWebhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 'ticket.created', ticket: ticket }),
})
```

### Method 3: n8n Polling Supabase

1. **Create n8n Workflow**:
   - Add a "Cron" node to run periodically (e.g., every minute)
   - Add a "Supabase" node to query new/updated tickets
   - Process tickets and update them back to Supabase

### Method 4: API Endpoint for n8n to Call

The app includes an API endpoint at `/api/webhooks/n8n` that n8n can call to update tickets:

```typescript
// From n8n HTTP Request node
POST /api/webhooks/n8n
{
  "event": "ticket.updated",
  "ticketId": "uuid",
  "updates": {
    "urgency": "high",
    "category": "system_admin",
    "ai_suggestions": "Try restarting..."
  }
}
```

## Recommended n8n Workflow Setup

### Workflow 1: Ticket Processing Pipeline

1. **Trigger**: Supabase Webhook (on ticket INSERT)
2. **AI Classification**: 
   - Classify urgency (low/medium/high/critical)
   - Classify category (account_management/system_admin/classroom_tech/general)
   - Classify department (student/faculty/staff)
3. **AI Suggestions**: 
   - If confidence > 80%, generate troubleshooting tips
   - Query Pinecone for similar past tickets
4. **Update Ticket**: Use Supabase node to update ticket with classifications and suggestions
5. **Send Email**: Send automated response to user

### Workflow 2: Ticket Update Notifications

1. **Trigger**: Supabase Webhook (on ticket UPDATE)
2. **Check Status**: If status changed to "resolved" or "closed"
3. **Send Email**: Notify user of status change

## Database Schema

See `supabase-schema.sql` for the complete database schema. Key tables:

- **tickets**: Main ticket table with all ticket information
- Indexes on status, urgency, category, email, and created_at for performance
- Row Level Security (RLS) policies for data access control
- Triggers for automatic timestamp updates and notifications

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── webhooks/      # Webhook endpoints for n8n
│   ├── submit/            # Ticket submission page
│   ├── tickets/           # User ticket viewing page
│   └── staff/             # Staff dashboard
├── components/            # React components
│   ├── TicketForm.tsx    # Ticket submission form
│   ├── TicketList.tsx    # User ticket list
│   └── StaffTicketList.tsx # Staff ticket management
├── lib/                   # Utility functions
│   └── supabase.ts       # Supabase client setup
├── types/                 # TypeScript types
│   └── database.ts       # Database type definitions
└── supabase-schema.sql   # Database schema
```

## Next Steps

- [ ] Implement proper authentication (Supabase Auth)
- [ ] Add email validation for .edu addresses
- [ ] Integrate with UVM directory
- [ ] Add FAQ section
- [ ] Implement estimated time to complete
- [ ] Add reinforcement learning feedback mechanism
- [ ] Style improvements and responsive design

## Development Notes

- Staff portal currently uses a simple password (`staff123`) for development
- Replace with proper authentication before production
- Email validation for .edu addresses is planned but not yet implemented
- Real-time updates work via Supabase subscriptions

## License

This project is for educational purposes as part of the AI Automation in Businesses course.




