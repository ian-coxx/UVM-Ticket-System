export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type Urgency = 'low' | 'medium' | 'high' | 'critical'
export type Category = 'account_management' | 'system_admin' | 'classroom_tech' | 'general'
export type Department = 'student' | 'faculty' | 'staff'
export type UserRole = 'user' | 'staff'

export interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  department?: Department
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: number | string // bigint in database, can be number or string
  userid?: string // UUID from auth.users
  operating_system?: string
  issue_description?: string
  category?: string
  urgency?: string
  department?: string
  // Optional fields that may be added by n8n or not present in actual table
  created_at?: string
  updated_at?: string
  title?: string
  description?: string // Legacy field name
  email?: string
  name?: string
  status?: TicketStatus
  assigned_to?: string
  estimated_time?: number // in minutes
  ai_confidence?: number // 0-100
  ai_suggestions?: string
  resolved_at?: string
  resolution_notes?: string
}

export interface TicketSubmission {
  title: string
  description: string
  email: string
  name?: string
  category?: Category
  department?: Department
}

