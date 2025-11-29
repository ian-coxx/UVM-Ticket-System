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
  id: string
  created_at: string
  updated_at: string
  title: string
  description: string
  email: string
  name?: string
  operating_system?: string
  status: TicketStatus
  urgency: Urgency
  category: Category
  department: Department
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

