import { useState } from 'react'
import { Zap, Play, Pause, ChevronRight, Plus, Wand2, ArrowRight, History, TestTube, Sun, Moon, ShieldOff, Thermometer, CloudRain } from 'lucide-react'
import { automations } from '../data/mock'
import '../styles/automations.css'

const categoryIcons: Record<string, React.ReactNode> = {
    morning: <Sun size={16} />,
    evening: <Moon size={16} />,
    away: <ShieldOff size={16} />,
    bedtime: <Moon size={16} />,
    sick: <Thermometer size={16} />,
    custom: <CloudRain size={16} />,
}

const categoryColors: Record<string, string> = {
    morning: '#fbbf24',
    evening: '#818cf8',
    away: '#34d399',
    bedtime: '#a78bfa',
    sick: '#f87171',
    custom: '#38bdf8',
}

const templates = [
    { name: 'Morning Routine', icon: '🌅', desc: 'Lights, coffee, briefing' },
    { name: 'Bedtime', icon: '🌙', desc: 'Lights off, doors locked' },
    { name: 'Away Mode', icon: '🏠', desc: 'Secure & save energy' },
    { name: 'Sick Day', icon: '🤒', desc: 'Comfort & cancel plans' },
    { name: 'Movie Night', icon: '🎬', desc: 'Dim lights, close blinds' },
    { name: 'Guest Mode', icon: '👋', desc: 'Guest WiFi, shared access' },
]

export default function Automations() {
    const [nlInput, setNlInput] = useState('')
    const [expandedId, setExpandedId] = useState<string | null>(null)

    return (
        <div className="automations-page fade-in">
            {/* ── Natural Language Input ── */}
            <div className="nl-input-card glass-card">
                <div className="nl-header">
                    <Wand2 size={16} className="nl-icon" />
                    <span>Describe your automation</span>
                </div>
                <div className="nl-input-wrap">
                    <input
                        className="nl-input"
                        placeholder="When I get home after 6, turn on hallway lights..."
                        value={nlInput}
                        onChange={e => setNlInput(e.target.value)}
                    />
                    <button className="nl-submit" disabled={!nlInput.trim()}>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* ── Templates ── */}
            <section className="section">
                <h2 className="section-title">Templates</h2>
                <div className="templates-scroll">
                    {templates.map(t => (
                        <button key={t.name} className="template-card">
                            <span className="template-icon">{t.icon}</span>
                            <span className="template-name">{t.name}</span>
                            <span className="template-desc">{t.desc}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Automation Rules ── */}
            <section className="section">
                <div className="section-header">
                    <h2 className="section-title">Your Automations</h2>
                    <button className="add-auto-btn">
                        <Plus size={14} />
                    </button>
                </div>

                <div className="auto-list">
                    {automations.map(auto => (
                        <div key={auto.id} className={`auto-card glass-card ${expandedId === auto.id ? 'expanded' : ''}`}>
                            <div className="auto-main" onClick={() => setExpandedId(expandedId === auto.id ? null : auto.id)}>
                                <div className="auto-icon" style={{ background: `${categoryColors[auto.category]}18`, color: categoryColors[auto.category] }}>
                                    {categoryIcons[auto.category]}
                                </div>
                                <div className="auto-info">
                                    <span className="auto-name">{auto.name}</span>
                                    <span className="auto-trigger">{auto.trigger}</span>
                                </div>
                                <div className="auto-right">
                                    <div className={`auto-toggle ${auto.enabled ? 'on' : 'off'}`}>
                                        <div className="toggle-knob" />
                                    </div>
                                </div>
                            </div>

                            {expandedId === auto.id && (
                                <div className="auto-expanded fade-in">
                                    {/* Visual rule flow */}
                                    <div className="rule-flow">
                                        <div className="rule-step trigger">
                                            <span className="rule-step-label">When</span>
                                            <span className="rule-step-value">{auto.trigger}</span>
                                        </div>
                                        {auto.conditions.length > 0 && (
                                            <>
                                                <div className="rule-arrow"><ChevronRight size={14} /></div>
                                                <div className="rule-step condition">
                                                    <span className="rule-step-label">If</span>
                                                    {auto.conditions.map(c => (
                                                        <span key={c} className="rule-step-value">{c}</span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        <div className="rule-arrow"><ChevronRight size={14} /></div>
                                        <div className="rule-step action">
                                            <span className="rule-step-label">Then</span>
                                            {auto.actions.map(a => (
                                                <span key={a} className="rule-step-value">{a}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="auto-meta">
                                        <div className="auto-meta-item">
                                            <Play size={12} />
                                            <span>Run {auto.runCount} times</span>
                                        </div>
                                        {auto.lastRun && (
                                            <div className="auto-meta-item">
                                                <History size={12} />
                                                <span>Last: {auto.lastRun}</span>
                                            </div>
                                        )}
                                        <button className="dry-run-btn">
                                            <TestTube size={12} />
                                            Dry Run
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
