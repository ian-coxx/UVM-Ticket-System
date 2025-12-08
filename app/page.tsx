'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    
    // Get user in background - don't block render
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setUser(user || null)
        
        // Check if staff and redirect in background
        if (user) {
          Promise.resolve(
            supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single()
          )
            .then((result: any) => {
              if (mounted && result?.data?.role === 'staff') {
                window.location.href = '/staff'
              }
            })
            .catch(() => {
              // Silently fail
            })
        }
      }
    }).catch(() => {
      // Silently fail - page still renders
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

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
          
          <a
            href="https://t.me/n8n_catTS_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-uvm-green mb-4">
              Telegram Bot
            </h2>
            <p className="text-gray-600">
              Get support and manage tickets via Telegram
            </p>
          </a>
        </div>
      </div>
    </main>
  )
}

