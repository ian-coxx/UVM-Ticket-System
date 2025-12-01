import type { Metadata } from 'next'
import './globals.css'
import '@n8n/chat/style.css'
import './chat-theme.css'
import AgentWindow from '../components/n8nAgent'

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
                <AgentWindow />
            </body>
        </html>
    )
}



