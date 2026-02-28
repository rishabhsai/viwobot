import { useState } from 'react'
import { Filter, ChevronDown, ChevronUp, Undo2, CheckCircle2, XCircle, Mic, Zap, Hand, CalendarClock } from 'lucide-react'
import { activityLog } from '../data/mock'
import '../styles/activity.css'

type SourceFilter = 'all' | 'voice' | 'automation' | 'manual' | 'schedule'
type ResultFilter = 'all' | 'success' | 'failure'

const sourceIcons = {
    voice: <Mic size={14} />,
    automation: <Zap size={14} />,
    manual: <Hand size={14} />,
    schedule: <CalendarClock size={14} />,
}

export default function Activity() {
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
    const [resultFilter, setResultFilter] = useState<ResultFilter>('all')
    const [expanded, setExpanded] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    const filtered = activityLog.filter(item => {
        if (sourceFilter !== 'all' && item.source !== sourceFilter) return false
        if (resultFilter !== 'all' && item.result !== resultFilter) return false
        return true
    })

    return (
        <div className="activity-page fade-in">
            {/* ── Filter Bar ── */}
            <div className="filter-bar">
                <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={16} />
                    <span>Filters</span>
                    {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <span className="filter-count">{filtered.length} actions</span>
            </div>

            {showFilters && (
                <div className="filter-chips fade-in">
                    <div className="filter-group">
                        <span className="filter-label">Source</span>
                        <div className="chips">
                            {(['all', 'voice', 'automation', 'manual', 'schedule'] as SourceFilter[]).map(s => (
                                <button key={s} className={`chip ${sourceFilter === s ? 'active' : ''}`} onClick={() => setSourceFilter(s)}>
                                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <span className="filter-label">Result</span>
                        <div className="chips">
                            {(['all', 'success', 'failure'] as ResultFilter[]).map(r => (
                                <button key={r} className={`chip ${resultFilter === r ? 'active' : ''}`} onClick={() => setResultFilter(r)}>
                                    {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Activity List ── */}
            <div className="activity-list">
                {filtered.map(item => (
                    <div
                        key={item.id}
                        className={`activity-item glass-card ${expanded === item.id ? 'expanded' : ''}`}
                        onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    >
                        <div className="activity-main">
                            <div className={`activity-status-icon ${item.result}`}>
                                {item.result === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            </div>
                            <div className="activity-info">
                                <span className="activity-action">{item.action}</span>
                                <div className="activity-meta">
                                    <span className={`source-tag ${item.source}`}>
                                        {sourceIcons[item.source]}
                                        {item.source}
                                    </span>
                                    <span className="activity-room">{item.room}</span>
                                    <span className="activity-time">{item.time}</span>
                                </div>
                            </div>
                            {item.explanation && (
                                <div className="expand-indicator">
                                    {expanded === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            )}
                        </div>

                        {expanded === item.id && item.explanation && (
                            <div className="activity-expanded fade-in">
                                <div className="explanation">
                                    <span className="explanation-label">Why did this happen?</span>
                                    <p className="explanation-text">{item.explanation}</p>
                                </div>
                                <div className="activity-devices">
                                    <span className="devices-label">Devices:</span>
                                    {item.devices.map(d => (
                                        <span key={d} className="device-tag">{d}</span>
                                    ))}
                                </div>
                                {item.reversible && (
                                    <button className="undo-btn">
                                        <Undo2 size={14} />
                                        Undo this action
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
