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
            const errorMessage = error?.message || String(error || '')
            const errorStack = error?.stack || ''
            
            // Check if it's a fetch error from n8n/chat (more comprehensive check)
            if (
                errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('fetch') ||
                errorStack.includes('@n8n/chat') ||
                errorStack.includes('chat.es.js')
            ) {
                // Prevent the error from showing in the error overlay
                event.preventDefault()
                event.stopPropagation()
                // Still log it for debugging but don't show to user
                console.debug('n8n chat fetch error (suppressed):', error)
                return false
            }
        }

        // Add error handler immediately, before any async operations
        window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true })

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

                // On localhost, check if webhook is accessible before initializing
                if (window.location.hostname === 'localhost' && chatWebhookUrl.startsWith('http://localhost')) {
                    try {
                        const controller = new AbortController()
                        const timeoutId = setTimeout(() => controller.abort(), 2000)
                        const response = await fetch(chatWebhookUrl, { 
                            method: 'HEAD',
                            signal: controller.signal
                        })
                        clearTimeout(timeoutId)
                        if (!response.ok) {
                            console.debug('n8n chat webhook not accessible on localhost, skipping initialization')
                            return
                        }
                    } catch (fetchError) {
                        // Webhook not available, skip chat initialization to avoid errors
                        console.debug('n8n chat webhook not accessible on localhost, skipping initialization')
                        return
                    }
                }

                // Dynamically import to prevent blocking initial page load
                // @ts-ignore - @n8n/chat may not be available
                const n8nChat = await import('@n8n/chat').catch(() => null)
                if (!n8nChat) {
                    console.warn('@n8n/chat not available')
                    return
                }
                const { createChat } = n8nChat
                
                // Wrap createChat in try-catch to prevent errors from breaking the app
                try {
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
                } catch (createError) {
                    // Chat widget creation failed - log but don't break app
                    console.debug('Failed to create n8n chat widget:', createError)
                }
            } catch (error) {
                // Silently fail - don't break the app if chat fails to load
                console.debug('Failed to initialize n8n chat:', error)
            }
        }

        // Initialize after a short delay to not block page render
        const timeout = setTimeout(initChat, 500)
        
        return () => {
            clearTimeout(timeout)
            window.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true })
        }
    }, [])

    return <div id="n8n-chat-root" />
}
