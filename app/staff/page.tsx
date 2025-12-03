'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import StaffTicketList from '@/components/StaffTicketList'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { User as UserProfile } from '@/types/database'

export default function StaffPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingCompleteRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && !loadingCompleteRef.current) {
        console.error('Loading timeout - redirecting to home')
        loadingCompleteRef.current = true
        setLoading(false)
        router.push('/')
      }
    }, 10000) // 10 second timeout
    
    // Get current user and profile
    supabase.auth.getUser().then(async ({ data: { user }, error: authError }) => {
      if (!mounted) return
      
      clearTimeout(timeoutId)
      
      if (authError || !user) {
        loadingCompleteRef.current = true
        setLoading(false)
        router.push('/login?redirect=/staff')
        return
      }

      setUser(user)

      // Get user profile to check role
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!mounted) return

        if (profileError) {
          console.error('Profile query error:', profileError)
          loadingCompleteRef.current = true
          setLoading(false)
          router.push('/')
          return
        }

        if (!profile || profile.role !== 'staff') {
          console.log('User is not staff, redirecting to home')
          loadingCompleteRef.current = true
          setLoading(false)
          router.push('/')
          return
        }

        setUserProfile(profile)
        loadingCompleteRef.current = true
        setLoading(false)
      } catch (error) {
        console.error('Error fetching profile:', error)
        if (mounted) {
          loadingCompleteRef.current = true
          setLoading(false)
          router.push('/')
        }
      }
    }).catch((error) => {
      console.error('Error getting user:', error)
      clearTimeout(timeoutId)
      if (mounted) {
        loadingCompleteRef.current = true
        setLoading(false)
        router.push('/login?redirect=/staff')
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      
      if (!session?.user) {
        loadingCompleteRef.current = true
        setLoading(false)
        router.push('/login?redirect=/staff')
        return
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!mounted) return

        if (profileError || !profile || profile.role !== 'staff') {
          loadingCompleteRef.current = true
          setLoading(false)
          router.push('/')
          return
        }

        setUser(session.user)
        setUserProfile(profile)
        loadingCompleteRef.current = true
        setLoading(false)
      } catch (error) {
        console.error('Error fetching profile in auth change:', error)
        if (mounted) {
          loadingCompleteRef.current = true
          setLoading(false)
          router.push('/')
        }
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
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!user || !userProfile) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/"
            className="text-uvm-green hover:underline inline-flex items-center"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {userProfile.name || user.email}
            </span>
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
        </div>
        <h1 className="text-3xl font-bold text-uvm-dark mb-2">Staff Dashboard</h1>
        <p className="text-gray-600 mb-6">Open tickets from students, sorted by urgency</p>
        <StaffTicketList />
      </div>
    </main>
  )
}
