'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const ticketSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  operating_system: z.string().min(1, 'Device operating system is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
})

type TicketFormData = z.infer<typeof ticketSchema>

export default function TicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        // Pre-fill email and name if user is logged in
        setValue('email', user.email || '')
        if (user.user_metadata?.name) {
          setValue('name', user.user_metadata.name)
        }
      }
    })
  }, [setValue])

  const onSubmit = async (data: TicketFormData) => {
    // Check if user is authenticated
    if (!user) {
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const supabase = createClient()
      
      // Verify user is authenticated and get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('No active session:', sessionError)
        console.error('Session error details:', sessionError)
        setSubmitStatus('error')
        setIsSubmitting(false)
        return
      }
      
      console.log('User authenticated:', user.id)
      console.log('Session exists:', !!session)
      console.log('Session user ID:', session.user.id)
      
      // Insert ticket into Supabase with default values
      // Flow: Frontend stores ticket → Supabase webhook triggers → n8n processes → n8n updates ticket
      // This ensures tickets are never lost and users get immediate confirmation
      // n8n will update fields like urgency, category, ai_suggestions after processing
      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          userid: user.id, // Use authenticated user's ID (required for RLS policy)
          operating_system: data.operating_system,
          issue_description: data.description, // The table uses issue_description, not description
          category: 'General', // Default category - n8n will update this after processing
        })
        .select()
        .single()

      if (error) throw error

      setTicketId(ticket.id)
      setSubmitStatus('success')
      reset()

      // Trigger n8n webhook (optional - can also use Supabase webhooks)
      const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
      if (n8nWebhookUrl) {
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'ticket.created',
            ticket: ticket,
          }),
        }).catch(console.error) // Don't block on webhook failure
      }
    } catch (error: any) {
      console.error('Error submitting ticket:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      setSubmitStatus('error')
      // Show more detailed error message
      if (error.message) {
        console.error('Supabase error message:', error.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-uvm-dark mb-2">Ticket Submission</h1>
      <p className="text-gray-600 mb-6">Describe the issue you're having</p>

      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <p className="font-semibold">Ticket submitted successfully!</p>
          {ticketId && (
            <p className="text-sm mt-1">Ticket ID: {ticketId}</p>
          )}
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>Failed to submit ticket. {!user ? 'Please log in to submit a ticket.' : 'Please try again.'}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
            placeholder="Your name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Your email address <span className="text-red-500">*</span>
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
              placeholder="your.email@uvm.edu"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
          <label htmlFor="operating_system" className="block text-sm font-medium text-gray-700 mb-2">
            Device operating system <span className="text-red-500">*</span>
            </label>
            <select
            {...register('operating_system')}
            id="operating_system"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M6%209L1%204h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-right pr-10"
            style={{ backgroundPosition: 'right 0.75rem center' }}
            >
            <option value="">Select an option ...</option>
            <option value="Windows">Windows</option>
            <option value="macOS">macOS</option>
            <option value="Linux">Linux</option>
            <option value="iOS">iOS</option>
            <option value="Android">Android</option>
            <option value="Other">Other</option>
            </select>
          {errors.operating_system && (
            <p className="mt-1 text-sm text-red-600">{errors.operating_system.message}</p>
          )}
          </div>

          <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description of your issue <span className="text-red-500">*</span>
            </label>
          <textarea
            {...register('description')}
            id="description"
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white resize-y"
            placeholder="Please provide detailed information about your issue..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] text-white py-3 px-6 rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}

