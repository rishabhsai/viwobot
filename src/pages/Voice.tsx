import { useState } from 'react'
import { Mic, Send, Smartphone, Speaker, Watch, Cpu } from 'lucide-react'
import { conversationHistory } from '../data/mock'
import type { ConversationMessage } from '../data/mock'
import '../styles/voice.css'

export default function Voice() {
    const [messages, setMessages] = useState<ConversationMessage[]>(conversationHistory)
    const [input, setInput] = useState('')
    const [isListening, setIsListening] = useState(false)

    const handleSend = () => {
        if (!input.trim()) return
        const userMsg: ConversationMessage = {
            id: `c${messages.length + 1}`,
            role: 'user',
            text: input,
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        }
        const botMsg: ConversationMessage = {
            id: `c${messages.length + 2}`,
            role: 'assistant',
            text: "I'll take care of that for you! ✨",
            time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        }
        setMessages([...messages, userMsg, botMsg])
        setInput('')
    }

    return (
        <div className="voice-page">
            {/* ── Device Indicator ── */}
            <div className="device-bar fade-in">
                <div className="device-indicator active">
                    <Smartphone size={12} />
                    <span>Phone</span>
                </div>
                <div className="device-indicator">
                    <Speaker size={12} />
                    <span>HomePod</span>
                </div>
                <div className="device-indicator">
                    <Watch size={12} />
                    <span>Watch</span>
                </div>
            </div>

            {/* ── Conversation Thread ── */}
            <div className="conversation-thread">
                {messages.map((msg, i) => (
                    <div key={msg.id} className={`message ${msg.role} fade-in stagger-${Math.min(i + 1, 6)}`}>
                        {msg.role === 'assistant' && (
                            <div className="bot-avatar">
                                <Cpu size={14} />
                            </div>
                        )}
                        <div className={`message-bubble ${msg.role}`}>
                            <p className="message-text">{msg.text}</p>
                            <div className="message-footer">
                                <span className="message-time">{msg.time}</span>
                                {msg.devices && (
                                    <div className="message-devices">
                                        {msg.devices.map(d => (
                                            <span key={d} className="msg-device-tag">{d}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Follow-up Chips ── */}
            <div className="follow-up-chips">
                <button className="follow-chip" onClick={() => setInput('Set that for weekdays')}>Set that for weekdays</button>
                <button className="follow-chip" onClick={() => setInput('What else is on?')}>What else is on?</button>
                <button className="follow-chip" onClick={() => setInput('Turn everything off')}>Turn everything off</button>
            </div>

            {/* ── Input Area ── */}
            <div className="voice-input-area">
                <div className="text-input-wrap">
                    <input
                        className="text-input"
                        placeholder="Type or tap mic..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    {input.trim() ? (
                        <button className="send-btn" onClick={handleSend}>
                            <Send size={16} />
                        </button>
                    ) : (
                        <button
                            className={`mic-btn ${isListening ? 'listening' : ''}`}
                            onClick={() => setIsListening(!isListening)}
                        >
                            <Mic size={18} />
                            {isListening && (
                                <>
                                    <div className="mic-ripple r1" />
                                    <div className="mic-ripple r2" />
                                    <div className="mic-ripple r3" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
