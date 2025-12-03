import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UVM Ticket System',
  description: 'IT Support Ticketing System for University of Vermont',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}






