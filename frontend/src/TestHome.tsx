import { useState, useEffect } from 'react'
import {
    SquareDashedKanban,
    Workflow,
    LayoutGrid,
    ListTodo,
    MessageCircle,
    BatteryMedium,
    Clock,
    Sparkles,
    ChevronRight,
    Mic,
    Brain,
    Volume2,
    CheckCircle2
} from 'lucide-react'
import { type TestViewMode } from './TestApp'
import { initialProactiveItems } from './features/data/mockData'
import { type NovaStatus, type Reminder } from './useNovaBackend'

interface TestHomeProps {
    onViewChange: (view: TestViewMode) => void
    status: NovaStatus
    connected: boolean
    reminders: Reminder[]
}

export default function TestHome({ onViewChange, status, connected, reminders }: TestHomeProps) {
    // 15 minute timer state
    const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds

    useEffect(() => {
        if (timeLeft <= 0) return
        const timerId = setInterval(() => {
            setTimeLeft(prev => prev - 1)
        }, 1000)
        return () => clearInterval(timerId)
    }, [timeLeft])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="test-home-container">
            <div className="test-header">
                <div style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.5px' }}>
                    Nova
                </div>
                <div className="header-center">
                    <div className="status-top">
                        <span className="battery">
                            <BatteryMedium size={14} color="#555" /> 98%
                        </span>
                    </div>
                    <span className="date-text">Fri, Feb 27</span>
                </div>
                <button type="button" className="avatar-btn">
                    R
                </button>
            </div>

            <div className="test-content">
                <div className="greeting-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>

                    {/* Active Timer Widget */}
                    {timeLeft > 0 && (
                        <div style={{
                            background: 'rgba(255,255,255,0.6)',
                            backdropFilter: 'blur(20px)',
                            padding: '1rem 1.5rem',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.25rem',
                            marginBottom: '1rem',
                            width: '100%',
                            maxWidth: '300px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ color: '#f97316', fontWeight: 700, fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace' }}>
                                <Clock size={32} /> {formatTime(timeLeft)}
                            </div>
                            <div style={{ color: '#555', fontSize: '0.9rem', fontWeight: 500 }}>
                                Focus sprint running
                            </div>
                            {/* Simple animated progress bar */}
                            <div style={{ width: '100%', height: '4px', background: '#e5e7eb', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(timeLeft / (15 * 60)) * 100}%`,
                                    height: '100%',
                                    background: '#f97316',
                                    transition: 'width 1s linear'
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Dynamic Reminders Top Section */}
                    {reminders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem', width: '100%', maxWidth: '300px' }}>
                            {reminders.map(r => (
                                <div key={r.id} style={{
                                    background: 'rgba(255,255,255,0.6)',
                                    backdropFilter: 'blur(20px)',
                                    padding: '0.8rem 1rem',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}>
                                    <Clock size={20} color="#f97316" />
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={{ color: '#f97316', fontWeight: 600, fontSize: '0.9rem' }}>Upcoming Reminder</div>
                                        <div style={{ color: '#555', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.2 }}>
                                            {r.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ marginBottom: '1rem' }}>
                            {/* Spacer if no reminders */}
                        </div>
                    )}

                    {/* Dynamic Greeting/State Area */}
                    {status.state === 'idle' ? (
                        <>
                            <h2>Good evening, Rishabh</h2>
                            <p>39°F and clear sky</p>
                            {!connected && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: 4 }}>Backend offline</p>}
                        </>
                    ) : (
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '24px',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '1rem',
                            width: '100%',
                            maxWidth: '300px'
                        }}>
                            {status.state === 'listening' && <><Mic size={32} color="#6366f1" className="pulse-anim" /><h3>Listening...</h3></>}
                            {status.state === 'thinking' && (
                                <>
                                    <Brain size={32} color="#f59e0b" className="pulse-anim" />
                                    <h3>Thinking</h3>
                                    {status.transcript && <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>"{status.transcript}"</p>}
                                </>
                            )}
                            {status.state === 'speaking' && (
                                <>
                                    <Volume2 size={32} color="#3b82f6" className="pulse-anim" />
                                    <h3>Speaking</h3>
                                    {status.response && <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{status.response}</p>}
                                </>
                            )}
                            {status.state === 'reminder' && (
                                <>
                                    <Clock size={32} color="#f97316" className="pulse-anim" />
                                    <h3>Reminder</h3>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>{status.message}</p>
                                </>
                            )}
                            {status.state === 'tutor_question' && (
                                <>
                                    <Sparkles size={32} color="#6366f1" />
                                    <h3>Study Mode: {status.topic}</h3>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{status.question}</p>
                                </>
                            )}
                            {status.state === 'tutor_feedback' && (
                                <>
                                    <CheckCircle2 size={32} color={status.correct ? "#10b981" : "#ef4444"} />
                                    <h3>{status.correct ? "Correct!" : "Not quite"}</h3>
                                    <p style={{ fontSize: '0.95rem' }}>{status.explanation}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Proactive Stack */}
                <div className="proactive-stack" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                    marginBottom: '1.5rem',
                    width: '100%',
                    maxWidth: '400px', // constrain max width if on desktop
                    margin: '0 auto 1.5rem' // center horizontally
                }}>
                    {initialProactiveItems.map((item) => (
                        <div key={item.id} style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.7)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Sparkles size={14} />
                                {item.title}
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', lineHeight: 1.3 }}>
                                {item.reason}
                            </div>
                            <button style={{
                                marginTop: 'auto',
                                background: 'transparent',
                                border: 'none',
                                color: '#111',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                padding: 0,
                                cursor: 'pointer'
                            }}>
                                Review <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="actions-grid">
                    <div className="grid-row-2">
                        <button type="button" className="action-card" onClick={() => onViewChange('automations')}>
                            <Workflow size={24} />
                            <span>Automations</span>
                        </button>
                        <button type="button" className="action-card" onClick={() => onViewChange('integrations')}>
                            <SquareDashedKanban size={24} />
                            <span>Integrations</span>
                        </button>
                    </div>

                    <div className="grid-row-3">
                        <button type="button" className="action-card" onClick={() => onViewChange('memories')}>
                            <LayoutGrid size={24} />
                            <span>Memories</span>
                        </button>
                        <button type="button" className="action-card" onClick={() => onViewChange('lists')}>
                            <ListTodo size={24} />
                            <span>Todos & Lists</span>
                        </button>
                        <button type="button" className="action-card" onClick={() => onViewChange('chat')}>
                            <MessageCircle size={24} />
                            <span>Text Nova</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
