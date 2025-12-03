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

export default function TicketList({ userId }: { userId?: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTickets = async () => {
    const supabase = createClient()
    try {
      setLoading(true)
      setError(null)
      
      // Get the current user to ensure we have the user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to view tickets')
        setLoading(false)
        return
      }

      let query = supabase
        .from('tickets')
        .select('*')
        .eq('userid', user.id) // Query by userid instead of email

      const { data, error } = await query

      if (error) {
        console.error('Supabase query error:', error)
        throw error
      }
      
      // Sort by id descending (bigint, so higher ID = newer)
      if (data) {
        data.sort((a: any, b: any) => {
          // id is bigint, so compare numerically
          const aId = typeof a.id === 'number' ? a.id : parseInt(a.id, 10)
          const bId = typeof b.id === 'number' ? b.id : parseInt(b.id, 10)
          return bId - aId // Descending order (newest first)
        })
      }

      if (error) throw error
      setTickets(data || [])
    } catch (err: any) {
      console.error('Error loading tickets:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const supabase = createClient()
    loadTickets()
    
    // Subscribe to real-time updates (optional - fails gracefully if Realtime is disabled)
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            // Successfully subscribed
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Realtime is not available - silently fail (app works without it)
            console.debug('Realtime subscription unavailable, continuing without auto-refresh')
          }
        })
    } catch (error) {
      // Realtime subscription failed - app works fine without it
      console.debug('Realtime subscription failed, continuing without auto-refresh:', error)
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, [userId])

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
            <h3 className="text-xl font-semibold text-uvm-dark">
              Ticket #{ticket.id}
            </h3>
            <div className="flex gap-2">
              {ticket.urgency && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${urgencyColors[ticket.urgency as keyof typeof urgencyColors] || urgencyColors.medium}`}
                >
                  {ticket.urgency.toUpperCase()}
                </span>
              )}
              {ticket.status && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[ticket.status as keyof typeof statusColors] || statusColors.open}`}
                >
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-600 mb-3 line-clamp-2">{ticket.issue_description || ticket.description || 'No description'}</p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex gap-4">
              {ticket.category && (
                <span>Category: {ticket.category.replace('_', ' ')}</span>
              )}
              {ticket.department && (
                <span>Department: {ticket.department}</span>
              )}
              {ticket.operating_system && (
                <span>OS: {ticket.operating_system}</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

