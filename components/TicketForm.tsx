'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Category, Department } from '@/types/database'
import { TicketSubmission } from '@/types/database'
import type { User } from '@supabase/supabase-js'

const ticketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  category: z.enum(['account_management', 'system_admin', 'classroom_tech', 'general']).optional(),
  department: z.enum(['student', 'faculty', 'staff']).optional(),
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
        // Pre-fill email if user is logged in
        setValue('email', user.email || '')
      }
    })
  }, [setValue])

  const onSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const supabase = createClient()
      // Insert ticket into Supabase
      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          title: data.title,
          description: data.description,
          email: data.email,
          name: data.name || null,
          category: data.category || 'general',
          department: data.department || 'student',
          status: 'open',
          urgency: 'medium', // Will be updated by n8n workflow
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
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h1 className="text-3xl font-bold text-uvm-dark mb-6">Submit a Ticket</h1>

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
          <p>Failed to submit ticket. Please try again.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            {...register('title')}
            type="text"
            id="title"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
            placeholder="Brief description of your issue"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
            placeholder="Please provide detailed information about your issue..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name (Optional)
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
              placeholder="Your name"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category (Optional)
            </label>
            <select
              {...register('category')}
              id="category"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Select category...</option>
              <option value="account_management">Account Management</option>
              <option value="system_admin">System Admin & Architecture</option>
              <option value="classroom_tech">Classroom Tech Services</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
              Department (Optional)
            </label>
            <select
              {...register('department')}
              id="department"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
            >
              <option value="">Select department...</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-uvm-green text-white py-3 px-6 rounded-md font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  )
}

