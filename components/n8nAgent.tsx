'use client'
import { useEffect } from 'react'

export default function AgentWindow() {
    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') {
            return
        }

        // Dynamically import and initialize chat to prevent blocking
        const initChat = async () => {
            try {
                // Get webhook URL - NEXT_PUBLIC_ vars are available at runtime in client components
                const chatWebhookUrl = 
                    process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL ||
                    (window.location.hostname === 'localhost' 
                        ? 'http://localhost:5678/webhook/3098e03b-da40-4ed3-93d4-47b67786dcc3/chat'
                        : null)
                
                if (!chatWebhookUrl) {
                    // Silently skip if not configured
                    return
                }

                // Dynamically import to prevent blocking initial page load
                const { createChat } = await import('@n8n/chat')
                
                createChat({
                    webhookUrl: chatWebhookUrl,
                    initialMessages: [
                        'Hey, my name is Rally, your IT support assistant.',
                        'How can I help you today?',
                    ],
                    i18n: {
                        en: {
                            title: 'UVM IT Support Assistant',
                            subtitle: "Ask me anything related to UVM IT services, and I'll help as best I can.",
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
        }
    }, [])

    return <div id="n8n-chat-root" />
}