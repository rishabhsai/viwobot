import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Plus, Clock, Bell, MapPin, AlertCircle, Tag } from 'lucide-react'
import { timers as mockTimers, reminders } from '../data/mock'
import type { Timer } from '../data/mock'
import '../styles/timers.css'

export default function Timers() {
    const [timerList, setTimerList] = useState<Timer[]>(mockTimers)
    const [tab, setTab] = useState<'timers' | 'reminders'>('timers')

    useEffect(() => {
        const interval = setInterval(() => {
            setTimerList(prev =>
                prev.map(t =>
                    t.isRunning && t.remaining > 0
                        ? { ...t, remaining: t.remaining - 1 }
                        : t.remaining <= 0 && t.isRunning
                            ? { ...t, isRunning: false }
                            : t
                )
            )
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const toggleTimer = (id: string) => {
        setTimerList(prev =>
            prev.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t)
        )
    }

    const resetTimer = (id: string) => {
        setTimerList(prev =>
            prev.map(t => t.id === id ? { ...t, remaining: t.duration, isRunning: false } : t)
        )
    }

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60)
        const secs = s % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getProgress = (t: Timer) => {
        const pct = ((t.duration - t.remaining) / t.duration) * 100
        const circumference = 2 * Math.PI * 42
        return circumference - (pct / 100) * circumference
    }

    const recurringIcon = (type: string) => {
        switch (type) {
            case 'daily': return <Clock size={14} />
            case 'weekdays': case 'weekends': return <Bell size={14} />
            case 'location': return <MapPin size={14} />
            default: return <Clock size={14} />
        }
    }

    return (
        <div className="timers-page fade-in">
            {/* ── Tab Switcher ── */}
            <div className="tab-switcher">
                <button className={`tab ${tab === 'timers' ? 'active' : ''}`} onClick={() => setTab('timers')}>
                    Timers
                </button>
                <button className={`tab ${tab === 'reminders' ? 'active' : ''}`} onClick={() => setTab('reminders')}>
                    Reminders
                </button>
            </div>

            {tab === 'timers' ? (
                <>
                    {/* ── Active Timers ── */}
                    <div className="timers-grid">
                        {timerList.map(t => (
                            <div key={t.id} className={`timer-card glass-card ${t.isRunning ? 'running' : ''} ${t.remaining === 0 ? 'done' : ''}`}>
                                <div className="timer-ring-wrap">
                                    <svg className="timer-ring" viewBox="0 0 96 96">
                                        <circle className="ring-bg" cx="48" cy="48" r="42" />
                                        <circle
                                            className="ring-progress"
                                            cx="48" cy="48" r="42"
                                            strokeDasharray={`${2 * Math.PI * 42}`}
                                            strokeDashoffset={getProgress(t)}
                                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                                        />
                                    </svg>
                                    <span className="timer-countdown">{formatTime(t.remaining)}</span>
                                </div>
                                <div className="timer-info">
                                    <span className="timer-label">{t.label}</span>
                                    {t.room && <span className="timer-room">{t.room}</span>}
                                </div>
                                <div className="timer-controls">
                                    <button className="timer-btn" onClick={() => toggleTimer(t.id)} aria-label={t.isRunning ? 'Pause' : 'Play'}>
                                        {t.isRunning ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    <button className="timer-btn" onClick={() => resetTimer(t.id)} aria-label="Reset">
                                        <RotateCcw size={16} />
                                    </button>
                                    <button className="timer-btn" aria-label="Relabel">
                                        <Tag size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="add-timer-btn">
                        <Plus size={18} />
                        <span>New Timer</span>
                    </button>
                </>
            ) : (
                <>
                    {/* ── Reminders ── */}
                    <div className="reminders-list">
                        {reminders.map(r => (
                            <div key={r.id} className={`reminder-card glass-card ${r.missed ? 'missed' : ''}`}>
                                <div className="reminder-left">
                                    <div className={`reminder-icon ${r.recurring}`}>
                                        {recurringIcon(r.recurring)}
                                    </div>
                                    <div className="reminder-info">
                                        <span className="reminder-text">{r.text}</span>
                                        <div className="reminder-meta">
                                            {r.time && <span>{r.time}</span>}
                                            <span className="recurring-badge">{r.recurring}</span>
                                            {r.location && <span className="location-text">{r.location}</span>}
                                        </div>
                                    </div>
                                </div>
                                {r.missed && (
                                    <div className="missed-badge">
                                        <AlertCircle size={12} />
                                        <span>Missed</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Missed Recovery ── */}
                    {reminders.filter(r => r.missed).length > 0 && (
                        <div className="missed-recovery glass-card">
                            <AlertCircle size={16} className="missed-recovery-icon" />
                            <div className="missed-recovery-info">
                                <span className="missed-recovery-title">You missed a reminder</span>
                                <span className="missed-recovery-text">Dentist appointment — Still need this?</span>
                            </div>
                            <div className="missed-recovery-actions">
                                <button className="missed-btn primary">Reschedule</button>
                                <button className="missed-btn">Dismiss</button>
                            </div>
                        </div>
                    )}

                    <button className="add-timer-btn">
                        <Plus size={18} />
                        <span>New Reminder</span>
                    </button>
                </>
            )}
        </div>
    )
}
