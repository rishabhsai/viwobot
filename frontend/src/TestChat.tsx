import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { type ChatMessage, type NovaStatus } from './useNovaBackend'

interface TestChatProps {
    onBack: () => void
    chatMessages: ChatMessage[]
    sendChat: (msg: string) => Promise<string | null>
    status: NovaStatus
}

export default function TestChat({ onBack, chatMessages, sendChat, status }: TestChatProps) {
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    const handleSend = async () => {
        const msg = input.trim()
        if (!msg || sending) return
        setInput('')
        setSending(true)
        await sendChat(msg)
        setSending(false)
    }

    return (
        <div className="test-subview-container">
            {/* Header */}
            <div className="integrations-header">
                <button className="back-btn" onClick={onBack}><ArrowLeft size={22} /></button>
                <h2>Text Nova</h2>
                <div style={{ width: 22 }} />
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}>
                {chatMessages.length === 0 && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#aaa',
                        fontSize: '0.95rem',
                        textAlign: 'center',
                        padding: '3rem 1rem'
                    }}>
                        Send a message to start chatting with Nova. <br />
                        Try "Set a timer for 5 minutes" or "What's on my schedule?"
                    </div>
                )}
                {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        background: msg.role === 'user' ? '#111' : '#f3f4f6',
                        color: msg.role === 'user' ? '#fff' : '#111',
                        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        padding: '0.8rem 1rem',
                        fontSize: '0.95rem',
                        lineHeight: 1.4
                    }}>
                        {msg.text}
                    </div>
                ))}
                {(status.state === 'thinking' || sending) && (
                    <div style={{
                        alignSelf: 'flex-start',
                        background: '#f3f4f6',
                        borderRadius: '20px 20px 20px 4px',
                        padding: '0.8rem 1rem',
                        fontSize: '0.95rem',
                        color: '#888'
                    }}>
                        Nova is thinking...
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid #eaeaea',
                display: 'flex',
                gap: '0.5rem',
                background: '#fff'
            }}>
                <input
                    style={{
                        flex: 1,
                        border: '1px solid #eaeaea',
                        borderRadius: '24px',
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        outline: 'none'
                    }}
                    placeholder="Message Nova..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    disabled={sending}
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    style={{
                        background: '#111',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        opacity: sending || !input.trim() ? 0.4 : 1
                    }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    )
}
