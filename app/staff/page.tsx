'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StaffTicketList from '@/components/StaffTicketList'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

export default function StaffPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isStaff, setIsStaff] = useState<boolean | null>(null) // null = checking, true = staff, false = not staff
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    
    // Get user first - don't block on profile check
    supabase.auth.getUser().then(({ data: { user }, error: authError }) => {
      if (!mounted) return
      
      if (authError || !user) {
        setUser(null)
        setChecking(false)
        setIsStaff(false)
        // Redirect to login after a moment
        setTimeout(() => {
          if (mounted) window.location.href = '/login?redirect=/staff'
        }, 1000)
        return
      }

      setUser(user)
      setChecking(false)
      
      // Check role in background - don't block page render
      Promise.resolve(
        supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
      )
        .then((result: any) => {
          if (!mounted) return
          if (result?.data?.role === 'staff') {
            setIsStaff(true)
          } else {
            setIsStaff(false)
            // Redirect non-staff after showing message
            setTimeout(() => {
              if (mounted) window.location.href = '/'
            }, 2000)
          }
        })
        .catch(() => {
          // If query fails, assume not staff for now
          if (mounted) {
            setIsStaff(false)
            console.error('Could not verify staff status - RLS may be blocking query')
          }
        })
    }).catch(() => {
      if (mounted) {
        setUser(null)
        setChecking(false)
        setIsStaff(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      if (!session?.user) {
        setUser(null)
        setIsStaff(false)
        window.location.href = '/login?redirect=/staff'
        return
      }

      setUser(session.user)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Show page immediately - don't wait for role check
  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </main>
    )
  }

  // Show access denied if we confirmed they're not staff
  if (isStaff === false && !checking) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You must be a staff member to access this page.</p>
            <p className="text-sm text-gray-500">Redirecting to home page...</p>
          </div>
        </div>
      </main>
    )
  }

  // Show staff dashboard (even if role check is still pending - optimistic render)
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-gray-600">
              {user.email}
            </span>
            {isStaff === null && (
              <span className="text-xs text-gray-400">(Verifying staff status...)</span>
            )}
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                window.location.href = '/'
              }}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-uvm-dark mb-2">Staff Dashboard</h1>
        <p className="text-gray-600 mb-6">Open tickets from students, sorted by urgency</p>
        {isStaff === null ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        ) : (
          <StaffTicketList />
        )}
      </div>
    </main>
  )
}
