'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Ticket, Category, Urgency, TicketStatus } from '@/types/database'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

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

const categoryLabels: Record<Category, string> = {
  account_management: 'Account Management',
  system_admin: 'System Admin',
  classroom_tech: 'Classroom Tech',
  general: 'General',
}

export default function StaffTicketList() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<{
    category: Category
    urgency: Urgency
    status: TicketStatus
    assigned_to?: string
  } | null>(null)

  const loadTickets = async () => {
    const supabase = createClient()
    try {
      setLoading(true)
      
      // Get all tickets with user role information
      // We need to join with users table to filter out staff tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
      
      if (ticketsError) {
        console.error('Error loading tickets:', ticketsError)
        throw ticketsError
      }

      console.log('All tickets loaded:', ticketsData?.length || 0, ticketsData)

      // Get all user IDs that are staff (to exclude their tickets)
      const { data: staffUsers, error: staffError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'staff')
      
      if (staffError) {
        console.error('Error loading staff users:', staffError)
        // Don't throw - just continue without filtering staff
      }
      
      const staffUserIds = new Set((staffUsers || []).map(u => u.id))
      console.log('Staff user IDs:', Array.from(staffUserIds))
      
      // Filter to only show tickets from students (not staff) and only open/in_progress tickets
      // If status is null/undefined, treat as 'open' (default)
      const studentTickets = (ticketsData || []).filter((ticket: any) => {
        // Only show tickets from students (userid not in staff list)
        const isStudentTicket = !ticket.userid || !staffUserIds.has(ticket.userid)
        // Only show open or in_progress tickets (or null/undefined status which we treat as open)
        const isOpen = !ticket.status || ticket.status === 'open' || ticket.status === 'in_progress'
        const shouldShow = isStudentTicket && isOpen
        if (!shouldShow) {
          console.log('Filtered out ticket:', {
            id: ticket.id,
            userid: ticket.userid,
            isStudent: isStudentTicket,
            status: ticket.status,
            isOpen
          })
        }
        return shouldShow
      })
      
      console.log('Student tickets after filtering:', studentTickets.length)
      
      // Sort by urgency first, then by submission time (newest first)
      const urgencyOrder: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      }
      
      studentTickets.sort((a: any, b: any) => {
        // First sort by urgency (critical > high > medium > low)
        const aUrgency = urgencyOrder[a.urgency || 'medium'] || 2
        const bUrgency = urgencyOrder[b.urgency || 'medium'] || 2
        if (aUrgency !== bUrgency) {
          return bUrgency - aUrgency // Higher urgency first
        }
        
        // Then sort by submission time (newest first)
        // Use id as proxy for time (higher ID = newer)
        const aId = typeof a.id === 'number' ? a.id : parseInt(String(a.id), 10)
        const bId = typeof b.id === 'number' ? b.id : parseInt(String(b.id), 10)
        return bId - aId // Descending order (newest first)
      })

      setTickets(studentTickets)
    } catch (err: any) {
      console.error('Error loading tickets:', err)
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
  }, [])

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsEditing(false)
    setEditForm({
      category: (ticket.category as Category) || 'general',
      urgency: (ticket.urgency as Urgency) || 'medium',
      status: (ticket.status as TicketStatus) || 'open',
      assigned_to: ticket.assigned_to || '',
    })
  }

  const handleSave = async () => {
    if (!selectedTicket || !editForm) {
      if (!editForm) {
        alert('Please select a ticket to edit')
        return
      }
      return
    }

    try {
      const supabase = createClient()
      const updateData: any = {
        category: editForm.category,
        urgency: editForm.urgency,
        status: editForm.status,
        assigned_to: editForm.assigned_to || null,
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', selectedTicket.id)
        .select()

      if (error) {
        console.error('Supabase update error:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          updateData,
          ticketId: selectedTicket.id
        })
        throw error
      }

      // Trigger n8n webhook for email notification
      const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
      if (n8nWebhookUrl) {
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ticket.updated',
            ticket: { ...selectedTicket, ...editForm },
          }),
        }).catch(console.error)
      }

      await loadTickets()
      setIsEditing(false)
      alert('Ticket updated successfully! Email sent to user.')
    } catch (err: any) {
      console.error('Error updating ticket:', err)
      const errorMessage = err?.message || err?.code || 'Unknown error'
      alert(`Failed to update ticket: ${errorMessage}`)
    }
  }

  // Tickets are already filtered to only open/in_progress student tickets in loadTickets
  const filteredTickets = tickets

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading tickets...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ticket List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-uvm-dark mb-4">Open Tickets</h2>
        {filteredTickets.length === 0 ? (
          <p className="text-gray-600">No open tickets.</p>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => handleTicketClick(ticket)}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                selectedTicket?.id === ticket.id ? 'ring-2 ring-uvm-green' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-uvm-dark">
                  Ticket #{ticket.id}
                </h3>
                <div className="flex gap-2">
                  {ticket.urgency && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${urgencyColors[ticket.urgency as Urgency] || urgencyColors.medium}`}
                    >
                      {ticket.urgency}
                    </span>
                  )}
                  {ticket.status && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[ticket.status as TicketStatus] || statusColors.open}`}
                    >
                      {ticket.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                {ticket.category && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {categoryLabels[ticket.category as Category] || ticket.category}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {ticket.issue_description || ticket.description || 'No description'}
              </p>
              <div className="flex justify-between items-center mt-2">
                {ticket.email && (
                  <p className="text-xs text-gray-500">
                    {ticket.email}
                  </p>
                )}
                {ticket.created_at && (
                  <p className="text-xs text-gray-500 ml-auto">
                    Submitted: {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Details */}
      {selectedTicket && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-uvm-dark mb-4">Ticket Details</h2>
          
          {!isEditing ? (
            <>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Ticket ID</h3>
                  <p className="text-gray-900">#{selectedTicket.id}</p>
                </div>
                {selectedTicket.created_at && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Submitted</h3>
                    <p className="text-gray-900">
                      {format(new Date(selectedTicket.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-700">Description</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedTicket.issue_description || selectedTicket.description || 'No description'}
                  </p>
                </div>
                {selectedTicket.email && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Contact</h3>
                    <p className="text-gray-900">{selectedTicket.email}</p>
                    {selectedTicket.name && (
                      <p className="text-gray-900">{selectedTicket.name}</p>
                    )}
                  </div>
                )}
                {selectedTicket.operating_system && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Operating System</h3>
                    <p className="text-gray-900">{selectedTicket.operating_system}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {selectedTicket.category && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Category</h3>
                      <p className="text-gray-900">
                        {categoryLabels[selectedTicket.category as Category] || selectedTicket.category}
                      </p>
                    </div>
                  )}
                  {selectedTicket.urgency && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Urgency</h3>
                      <p className="text-gray-900">{selectedTicket.urgency}</p>
                    </div>
                  )}
                  {selectedTicket.status && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Status</h3>
                      <p className="text-gray-900">{selectedTicket.status}</p>
                    </div>
                  )}
                  {selectedTicket.department && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Department</h3>
                      <p className="text-gray-900">{selectedTicket.department}</p>
                    </div>
                  )}
                </div>
                {selectedTicket.ai_suggestions && (
                  <div>
                    <h3 className="font-semibold text-gray-700">AI Suggestions</h3>
                    <p className="text-gray-900">{selectedTicket.ai_suggestions}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-6 bg-uvm-green text-white py-2 px-6 rounded-md font-semibold hover:bg-opacity-90 transition-colors"
              >
                Edit Ticket
              </button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={editForm?.category || 'general'}
                    onChange={(e) => editForm && setEditForm({ ...editForm, category: e.target.value as Category })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    <option value="account_management">Account Management</option>
                    <option value="system_admin">System Admin</option>
                    <option value="classroom_tech">Classroom Tech</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Urgency</label>
                  <select
                    value={editForm?.urgency || 'medium'}
                    onChange={(e) => editForm && setEditForm({ ...editForm, urgency: e.target.value as Urgency })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={editForm?.status || 'open'}
                    onChange={(e) => editForm && setEditForm({ ...editForm, status: e.target.value as TicketStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Assigned To</label>
                  <input
                    type="text"
                    value={editForm?.assigned_to || ''}
                    onChange={(e) => editForm && setEditForm({ ...editForm, assigned_to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                    placeholder="Staff member email or name"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-uvm-green text-white py-2 px-6 rounded-md font-semibold hover:bg-opacity-90 transition-colors"
                >
                  Save & Send Email
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-6 rounded-md font-semibold hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

