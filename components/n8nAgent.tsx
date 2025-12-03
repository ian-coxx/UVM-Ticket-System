'use client'
import { useEffect } from 'react'
import { createChat } from '@n8n/chat'

export default function AgentWindow() {
    useEffect(() => {
        // Only initialize chat if webhook URL is configured
        // Use environment variable for production webhook URL
        const chatWebhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL
        
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