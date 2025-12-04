'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import TicketList from '@/components/TicketList'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function TicketsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingCompleteRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && !loadingCompleteRef.current) {
        console.error('Tickets page loading timeout - showing page anyway')
        loadingCompleteRef.current = true
        setLoading(false)
      }
    }, 5000) // 5 second timeout
    
    // Get current user
    supabase.auth.getUser().then(({ data: { user }, error: authError }) => {
      if (!mounted) return
      
      clearTimeout(timeoutId)
      
      if (authError || !user) {
        loadingCompleteRef.current = true
        setLoading(false)
        router.push('/login?redirect=/tickets')
        return
      }
      
      setUser(user)
      loadingCompleteRef.current = true
      setLoading(false)
    }).catch((error) => {
      console.error('Error getting user:', error)
      clearTimeout(timeoutId)
      if (mounted) {
        loadingCompleteRef.current = true
        setLoading(false)
        router.push('/login?redirect=/tickets')
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      if (!session?.user) {
        loadingCompleteRef.current = true
        setLoading(false)
        router.push('/login?redirect=/tickets')
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

  if (!user) {
    // Don't return null - show loading or redirect
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Redirecting to login...</p>
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
            href="/"
            className="text-uvm-green hover:underline inline-flex items-center"
          >
            ← Back to Home
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

        <h1 className="text-3xl font-bold text-uvm-dark mb-6">Your Tickets</h1>
        <TicketList userId={user.id} />
      </div>
    </main>
  )
}
