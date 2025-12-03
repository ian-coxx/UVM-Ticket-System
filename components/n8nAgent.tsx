'use client'
import { useEffect } from 'react'
import { createChat } from '@n8n/chat'

export default function AgentWindow() {
    useEffect(() => {
        createChat({
            webhookUrl: 'http://localhost:5678/webhook/3098e03b-da40-4ed3-93d4-47b67786dcc3/chat',
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
    }, [])

    return <div id="n8n-chat-root" />
}