import TicketForm from '@/components/TicketForm'
import Link from 'next/link'

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-uvm-green hover:underline inline-flex items-center"
        >
          ← Back to Home
        </Link>
      </div>
      <TicketForm />
    </main>
  )
}



