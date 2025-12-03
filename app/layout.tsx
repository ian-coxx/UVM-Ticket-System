import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import './chat-theme.css'
import dynamic from 'next/dynamic'

// Dynamically import agent component to prevent blocking
const AgentWindow = dynamic(() => import('../components/n8nAgent'), {
    ssr: false,
    loading: () => null,
})

// Import chat CSS - this should work if the package is installed
import '@n8n/chat/style.css'

export const metadata: Metadata = {
    title: 'UVM Ticket System',
    description: 'IT Support Ticketing System for University of Vermont',
}

export default function RootLayout({children,}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                {children}
                <Suspense fallback={null}>
                    <AgentWindow />
                </Suspense>
            </body>
        </html>
    )
}
