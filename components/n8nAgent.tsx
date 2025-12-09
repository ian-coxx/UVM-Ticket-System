'use client'
import { useEffect } from 'react'

export default function AgentWindow() {
    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') {
            return
        }

        // Suppress "Failed to fetch" errors from n8n chat that don't break functionality
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason
            // Check if it's a fetch error from n8n/chat
            if (
                error?.message?.includes('Failed to fetch') ||
                (error?.stack?.includes('@n8n/chat') && error?.message?.includes('fetch'))
            ) {
                // Prevent the error from showing in the error overlay
                event.preventDefault()
                // Still log it for debugging but don't show to user
                console.debug('n8n chat fetch error (suppressed):', error)
            }
        }

        window.addEventListener('unhandledrejection', handleUnhandledRejection)

        // Dynamically import and initialize chat to prevent blocking
        const initChat = async () => {
            try {
                // Get webhook URL - NEXT_PUBLIC_ vars are available at runtime in client components
                const chatWebhookUrl = 
                    process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL ||
                    (window.location.hostname === 'localhost' 
                        ? 'http://localhost:5678/webhook/3098e03b-da40-4ed3-93d4-47b67786dcc3/chat'
                        : 'https://colinbutera.app.n8n.cloud/webhook/3098e03b-da40-4ed3-93d4-47b67786dcc3/chat')
                
                if (!chatWebhookUrl) {
                    // Silently skip if not configured
                    return
                }

                // Dynamically import to prevent blocking initial page load
                // @ts-ignore - @n8n/chat may not be available
                const n8nChat = await import('@n8n/chat').catch(() => null)
                if (!n8nChat) {
                    console.warn('@n8n/chat not available')
                    return
                }
                const { createChat } = n8nChat
                
                createChat({
                    webhookUrl: chatWebhookUrl,
                    initialMessages: [
                        'Hey, my name is Rally, your IT support assistant.',
                        'What can I help you troubleshoot today?',
                    ],
                    i18n: {
                        en: {
                            title: 'UVM IT Support Assistant',
                            subtitle: "Ask me anything related to UVM services, and I'll help as best I can using my knowledge.",
                            footer: '',
                            getStarted: 'New Conversation',
                            inputPlaceholder: 'Type your question...',
                            closeButtonTooltip: ''
                        },
                    },
                })
            } catch (error) {
                // Silently fail - don't break the app if chat fails to load
                console.error('Failed to initialize n8n chat:', error)
            }
        }

        // Initialize after a short delay to not block page render
        const timeout = setTimeout(initChat, 500)
        
        return () => {
            clearTimeout(timeout)
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        }
    }, [])

    return <div id="n8n-chat-root" />
}
