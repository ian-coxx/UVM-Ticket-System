'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const supabase = createClient()
    
    // Get current user and profile
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login?redirect=/staff')
        return
      }

      setUser(user)

      // Get user profile to check role
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'staff') {
        router.push('/')
        return
      }

      setUserProfile(profile)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push('/login?redirect=/staff')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'staff') {
        router.push('/')
        return
      }

      setUser(session.user)
      setUserProfile(profile)
    })

    return () => subscription.unsubscribe()
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
        <h1 className="text-3xl font-bold text-uvm-dark mb-6">Staff Dashboard</h1>
        <StaffTicketList />
      </div>
    </main>
  )
}
