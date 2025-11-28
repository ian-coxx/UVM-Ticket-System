'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket } from '@/types/database'
import { format } from 'date-fns'
import Link from 'next/link'

const urgencyColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

const statusColors = {
  open: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-200 text-gray-600',
}

export default function TicketList({ userEmail }: { userEmail?: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    loadTickets()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          loadTickets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userEmail])

  const loadTickets = async () => {
    const supabase = createClient()
    try {
      setLoading(true)
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (userEmail) {
        query = query.eq('email', userEmail)
      }

      const { data, error } = await query

      if (error) throw error
      setTickets(data || [])
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()
    loadTickets()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        () => {
          loadTickets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userEmail])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading tickets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No tickets found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/tickets/${ticket.id}`}
          className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-semibold text-uvm-dark">{ticket.title}</h3>
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${urgencyColors[ticket.urgency]}`}
              >
                {ticket.urgency.toUpperCase()}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[ticket.status]}`}
              >
                {ticket.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex gap-4">
              <span>Category: {ticket.category.replace('_', ' ')}</span>
              <span>Department: {ticket.department}</span>
            </div>
            <span>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

