'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
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

    // Validate password
    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      })
      setLoading(false)
      return
    }

    // Validate password match
    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match',
      })
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // Create user profile in public.users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email || '',
            name: name || authData.user.email?.split('@')[0] || null,
            role: 'user',
            department: 'student',
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          // Don't fail signup if profile creation fails, but log it
        }

        setMessage({
          type: 'success',
          text: 'Account created successfully! Redirecting to login...',
        })

        // Wait a moment then redirect to login
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Error signing up:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create account. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-uvm-dark mb-2">Create Account</h1>
        <p className="text-gray-600 mb-6">
          Sign up with your @uvm.edu email address
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

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name (Optional)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              UVM Email Address *
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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
              required
              minLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">
              Password must be at least 6 characters
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-uvm-green focus:border-transparent text-gray-900 bg-white"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-uvm-green text-white py-3 px-6 rounded-md font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-uvm-green hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
          <Link
            href="/"
            className="text-uvm-green hover:underline text-sm block"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}


