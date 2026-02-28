import { useState, useEffect } from 'react'

export default function TimersTab() {
    const [reminders, setReminders] = useState([
        { id: '1', title: 'Take vitamins', time: '8:00 AM', active: true },
        { id: '2', title: 'Water plants', time: '10:00 AM', active: true }
    ])

    return (
        <div className="n-section-gap">
            <div className="n-panel">
                <div className="n-panel-head">
                    <span className="n-panel-title">Timers</span>
                    <span className="n-meta">0 active</span>
                </div>
                <div className="n-empty">
                    <p className="n-empty-title">No active timers</p>
                    <button className="n-btn primary">Set Timer</button>
                </div>
            </div>

            <div className="n-panel" style={{ padding: 0 }}>
                <div className="n-panel-head" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>
                    <span className="n-panel-title">Reminders</span>
                </div>
                {reminders.map(r => (
                    <div key={r.id} className="n-proactive" style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <p className="n-label" style={{ opacity: r.active ? 1 : 0.5 }}>{r.title}</p>
                            <p className="n-meta">{r.time}</p>
                        </div>
                        <button
                            className="n-btn"
                            onClick={() => setReminders(prev => prev.map(x => x.id === r.id ? { ...x, active: !x.active } : x))}
                        >
                            {r.active ? 'Disable' : 'Enable'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
