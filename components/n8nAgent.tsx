'use client'
import { useEffect } from 'react'
import { createChat } from '@n8n/chat'

export default function AgentWindow() {
    useEffect(() => {
        // Get webhook URL from environment variable or use default for development
        // Priority: 1) Environment variable (production), 2) Default localhost (development)
        const chatWebhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL || 
            (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
                ? 'http://localhost:5678/webhook/3098e03b-da40-4ed3-93d4-47b67786dcc3/chat'
                : null)
        
        if (!chatWebhookUrl) {
            // Silently skip chat initialization if webhook URL is not configured
            // This prevents errors in production when n8n chat is not set up
            return
        }

        try {
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
            // Silently handle errors to prevent console spam
            console.error('Failed to initialize n8n chat:', error)
        }
    }, [])

    return <div id="n8n-chat-root" />
}