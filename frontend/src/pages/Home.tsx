import { useState } from 'react'
import { Timer, Play, Coffee, Zap, PauseCircle, ChevronRight, Lightbulb, Thermometer, Lock, Speaker, Eye } from 'lucide-react'
import { timers, activityLog, devices, proactiveSuggestions } from '../data/mock'
import '../styles/home.css'

export default function Home() {
    const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null)

    const activeTimers = timers.filter(t => t.isRunning)
    const recentActivity = activityLog.slice(0, 3)

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'light': return <Lightbulb size={14} />
            case 'thermostat': return <Thermometer size={14} />
            case 'lock': return <Lock size={14} />
            case 'speaker': return <Speaker size={14} />
            case 'camera': return <Eye size={14} />
            default: return <Zap size={14} />
        }
    }

    const rooms = [...new Set(devices.map(d => d.room))]

    return (
        <div className="home-page fade-in">
            {/* ── Proactive Suggestions ── */}
            {proactiveSuggestions.length > 0 && (
                <section className="proactive-section">
                    {proactiveSuggestions.slice(0, 2).map((s, i) => (
                        <div
                            key={s.id}
                            className={`proactive-card glass-card stagger-${i + 1} ${expandedSuggestion === s.id ? 'expanded' : ''}`}
                            onClick={() => setExpandedSuggestion(expandedSuggestion === s.id ? null : s.id)}
                        >
                            <div className="proactive-header">
                                <span className="proactive-icon">{s.icon}</span>
                                <p className="proactive-msg">{s.message}</p>
                            </div>
                            {expandedSuggestion === s.id && (
                                <div className="proactive-detail fade-in">
                                    <p className="proactive-reason">{s.reason}</p>
                                    <div className="proactive-actions">
                                        {s.actions.map(a => (
                                            <button key={a.label} className={`proactive-btn ${a.primary ? 'primary' : ''}`}>
                                                {a.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* ── Right Now ── */}
            <section className="section">
                <h2 className="section-title">Right Now</h2>
                <div className="right-now-grid">
                    {activeTimers.map(t => (
                        <div key={t.id} className="now-card glass-card">
                            <div className="now-card-icon timer-icon">
                                <Timer size={16} />
                            </div>
                            <div className="now-card-info">
                                <span className="now-card-label">{t.label}</span>
                                <span className="now-card-value">{formatTime(t.remaining)}</span>
                            </div>
                            <span className="now-card-room">{t.room}</span>
                        </div>
                    ))}
                    <div className="now-card glass-card">
                        <div className="now-card-icon reminder-icon">
                            <Coffee size={16} />
                        </div>
                        <div className="now-card-info">
                            <span className="now-card-label">Next reminder</span>
                            <span className="now-card-value">Water plants · 10 AM</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Quick Actions ── */}
            <section className="section">
                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions-grid">
                    <button className="quick-action">
                        <div className="qa-icon qa-timer"><Timer size={20} /></div>
                        <span>Set Timer</span>
                    </button>
                    <button className="quick-action">
                        <div className="qa-icon qa-auto"><Zap size={20} /></div>
                        <span>Automate</span>
                    </button>
                    <button className="quick-action">
                        <div className="qa-icon qa-announce"><Speaker size={20} /></div>
                        <span>Announce</span>
                    </button>
                    <button className="quick-action">
                        <div className="qa-icon qa-pause"><PauseCircle size={20} /></div>
                        <span>Pause All</span>
                    </button>
                </div>
            </section>

            {/* ── Rooms & Devices ── */}
            <section className="section">
                <h2 className="section-title">Your Home</h2>
                <div className="rooms-scroll">
                    {rooms.map(room => {
                        const roomDevices = devices.filter(d => d.room === room)
                        const activeCount = roomDevices.filter(d => d.status === 'on' || d.status === 'locked').length
                        return (
                            <div key={room} className="room-card glass-card">
                                <div className="room-header">
                                    <span className="room-name">{room}</span>
                                    <span className={`room-status ${activeCount > 0 ? 'active' : ''}`}>
                                        {activeCount > 0 ? `${activeCount} active` : 'All off'}
                                    </span>
                                </div>
                                <div className="room-devices">
                                    {roomDevices.map(d => (
                                        <div key={d.id} className={`device-chip ${d.status === 'on' || d.status === 'locked' ? 'on' : 'off'}`}>
                                            {getDeviceIcon(d.type)}
                                            <span>{d.name}</span>
                                            {d.value && <span className="device-value">{d.value}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* ── Today Timeline ── */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Today</h2>
                    <button className="see-all">See all <ChevronRight size={14} /></button>
                </div>
                <div className="timeline">
                    {recentActivity.map((item, i) => (
                        <div key={item.id} className={`timeline-item stagger-${i + 1}`}>
                            <div className="timeline-dot-wrap">
                                <div className={`timeline-dot ${item.result}`} />
                                {i < recentActivity.length - 1 && <div className="timeline-line" />}
                            </div>
                            <div className="timeline-content">
                                <span className="timeline-action">{item.action}</span>
                                <div className="timeline-meta">
                                    <span className={`source-badge ${item.source}`}>{item.source}</span>
                                    <span className="timeline-time">{item.time}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
