import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This endpoint can be called by n8n to update tickets
// n8n can use HTTP Request node to POST to this endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, ticketId, updates } = body

    if (!ticketId || !updates) {
      return NextResponse.json(
        { error: 'Missing ticketId or updates' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update ticket in Supabase
    const { data, error } = await supabase
      .from('tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .select()
      .single()

    if (error) {
      console.error('Error updating ticket:', error)
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, ticket: data })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

