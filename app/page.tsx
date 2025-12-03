import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user profile to check role
  let userRole: 'user' | 'staff' | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role || null
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
              {userRole === 'staff' && (
              <Link
                href="/staff"
                className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <h2 className="text-2xl font-semibold text-uvm-green mb-4">
                  Staff Portal
                </h2>
                <p className="text-gray-600">
                  Access the technician dashboard to manage tickets
                </p>
              </Link>
              )}
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
            </>
          )}
        </div>
      </div>
    </main>
  )
}

