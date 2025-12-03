'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket } from '@/types/database'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { User } from '@supabase/supabase-js'

interface TicketMessage {
  id: string
  ticket_id: string
  user_id: string
  message: string
  created_at: string
  user_email?: string
  user_name?: string
}

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

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string
  
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<'user' | 'staff' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Get current user
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login?redirect=/tickets')
        return
      }

      setUser(user)

      // Get user role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role as 'user' | 'staff' | null
      if (profile) {
        setUserRole(role)
      }

      // Load ticket
      await loadTicket(user.id, role)
      loadMessages()
    })
  }, [ticketId, router])

  const loadTicket = async (userId: string, role: 'user' | 'staff' | null = null) => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single()

      if (error) throw error

      // Verify user owns this ticket or is staff
      if (data.userid !== userId && role !== 'staff') {
        setError('You do not have permission to view this ticket')
        setLoading(false)
        return
      }

      setTicket(data)
    } catch (err: any) {
      console.error('Error loading ticket:', err)
      setError(err.message || 'Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Get user info for each message
      const messagesWithUsers = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', msg.user_id)
            .single()
            .catch(() => ({ data: null }))

          return {
            ...msg,
            user_email: profile?.email,
            user_name: profile?.name || profile?.email?.split('@')[0] || 'Unknown User',
          }
        })
      )

      setMessages(messagesWithUsers)
    } catch (err: any) {
      console.error('Error loading messages:', err)
      // Don't fail the page if messages fail to load
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !ticket) return

    setSending(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          message: newMessage.trim(),
        })

      if (error) throw error

      setNewMessage('')
      loadMessages() // Reload messages
    } catch (err: any) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading ticket...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-red-600 mb-4">{error || 'Ticket not found'}</p>
            <Link href="/tickets" className="text-uvm-green hover:underline">
              ← Back to Tickets
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/tickets"
            className="text-uvm-green hover:underline inline-flex items-center"
          >
            ← Back to Tickets
          </Link>
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/')
            }}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Sign Out
          </button>
        </div>

        {/* Ticket Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-uvm-dark">
              Ticket #{ticket.id}
            </h1>
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

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Category</h3>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                {ticket.category ? ticket.category.replace('_', ' ') : 'General'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Only staff can change the category
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Operating System</h3>
              <p className="text-gray-900">{ticket.operating_system || 'Not specified'}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">
                {ticket.issue_description || ticket.description || 'No description'}
              </p>
            </div>

            {ticket.ai_suggestions && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">AI Suggestions</h3>
                <p className="text-gray-900 bg-blue-50 p-3 rounded">
                  {ticket.ai_suggestions}
                </p>
              </div>
            )}

            <div className="flex gap-4 text-sm text-gray-500 pt-4 border-t">
              {ticket.created_at && (
                <span>Created: {format(new Date(ticket.created_at), 'PPp')}</span>
              )}
              {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                <span>Updated: {format(new Date(ticket.updated_at), 'PPp')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-uvm-dark mb-4">Follow-up Messages</h2>

          {/* Messages List */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages yet. Be the first to add a follow-up!</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.user_id === user?.id
                      ? 'bg-uvm-green bg-opacity-10 ml-8'
                      : 'bg-gray-50 mr-8'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {message.user_name || message.user_email || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(message.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Message Form */}
          <form onSubmit={handleSendMessage} className="border-t pt-4">
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Add a follow-up message
              </label>
              <textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="w-full bg-uvm-green text-white py-2 px-4 rounded-md font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

