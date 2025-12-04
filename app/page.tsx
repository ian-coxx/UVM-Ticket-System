'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingCompleteRef = useRef(false)
  const redirectAttemptedRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && !loadingCompleteRef.current) {
        loadingCompleteRef.current = true
        setLoading(false)
      }
    }, 3000) // 3 second timeout
    
    // Get current user
    supabase.auth.getUser().then(async ({ data: { user }, error: authError }) => {
      if (!mounted) return
      
      clearTimeout(timeoutId)
      
      if (authError || !user) {
        loadingCompleteRef.current = true
        setUser(null)
        setLoading(false)
        return
      }

      setUser(user)
      
      // Try to get profile and redirect if staff, but don't block on it
      if (!redirectAttemptedRef.current) {
        redirectAttemptedRef.current = true
        try {
          const profilePromise = supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          
          // Add timeout to profile query
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 2000)
          )
          
          const result = await Promise.race([profilePromise, timeoutPromise]) as any
          
          if (result && !result.error && result.data && result.data.role === 'staff') {
            // Redirect staff to staff portal
            window.location.href = '/staff'
            return
          }
        } catch (error) {
          // If profile query fails, just continue - don't block
          console.error('Profile query failed, continuing:', error)
        }
      }
      
      loadingCompleteRef.current = true
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting user:', error)
      clearTimeout(timeoutId)
      if (mounted) {
        loadingCompleteRef.current = true
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      if (!session?.user) {
        loadingCompleteRef.current = true
        setUser(null)
        setLoading(false)
        return
      }

      setUser(session.user)
      if (!loadingCompleteRef.current) {
        loadingCompleteRef.current = true
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [router])
  
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-uvm-dark mb-4">
            UVM IT Support
          </h1>
          <p className="text-xl text-gray-600">
            Submit a ticket or view your existing tickets
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/submit"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-uvm-green mb-4">
              Submit Ticket
            </h2>
            <p className="text-gray-600">
              Create a new support ticket for IT assistance
            </p>
          </Link>

          {user ? (
            <>
              <Link
                href="/tickets"
                className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <h2 className="text-2xl font-semibold text-uvm-green mb-4">
                  My Tickets
                </h2>
                <p className="text-gray-600">
                  View and manage your submitted tickets
                </p>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/tickets"
                className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <h2 className="text-2xl font-semibold text-uvm-green mb-4">
                  View Tickets
                </h2>
                <p className="text-gray-600">
                  Check the status of your submitted tickets
                </p>
              </Link>
              <Link
                href="/login"
                className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <h2 className="text-2xl font-semibold text-uvm-green mb-4">
                  Sign In
                </h2>
                <p className="text-gray-600">
                  Sign in with your @uvm.edu email and password
                </p>
              </Link>
              <Link
                href="/signup"
                className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <h2 className="text-2xl font-semibold text-uvm-green mb-4">
                  Create Account
                </h2>
                <p className="text-gray-600">
                  Sign up with your @uvm.edu email to get started
                </p>
              </Link>
              <Link
                href="/staff/signup"
                className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <h2 className="text-2xl font-semibold text-uvm-green mb-4">
                  Staff Sign Up
                </h2>
                <p className="text-gray-600">
                  Create a staff account to access the technician portal
                </p>
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

