'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Check for error from auth callback
  useEffect(() => {
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    if (error) {
      setMessage({
        type: 'error',
        text: errorDescription || 'Authentication failed. Please try requesting a new magic link.',
      })
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validate @uvm.edu email
    if (!email.endsWith('@uvm.edu')) {
      setMessage({
        type: 'error',
        text: 'Please use a @uvm.edu email address',
      })
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      // Use environment variable for production, fallback to window.location for local dev
      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`
      
      console.log('Magic link redirect URL:', redirectUrl)
      console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
      console.log('window.location.origin:', window.location.origin)
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Check your email for a magic link to sign in!',
      })
    } catch (error: any) {
      console.error('Error sending magic link:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send magic link. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-uvm-dark mb-2">Sign In</h1>
        <p className="text-gray-600 mb-6">
          Enter your @uvm.edu email address to receive a magic link
        </p>

        {message && (
          <div
            className={`mb-6 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
          >
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              UVM Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@uvm.edu"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Only @uvm.edu email addresses are allowed
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-uvm-green text-white py-3 px-6 rounded-md font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-uvm-green hover:underline text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}

