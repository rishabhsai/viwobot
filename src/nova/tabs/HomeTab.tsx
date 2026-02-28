import { useState } from 'react'
import { proactiveItems } from '../data'

export default function HomeTab() {
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())

    const visible = proactiveItems.filter(p => !dismissed.has(p.id))

    return (
        <div className="n-section-gap">
            <div className="n-panel">
                <p className="n-meta">Today</p>
                <p className="n-label">
                    41 actions handled, 3 items need review.
                </p>
            </div>

            <div className="n-panel" style={{ padding: 0 }}>
                <div className="n-panel-head" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>
                    <span className="n-panel-title">Suggestions</span>
                </div>

                {visible.length === 0 && (
                    <div className="n-empty">
                        <p className="n-empty-title">Caught up</p>
                        <p className="n-empty-desc">No new suggestions from Nova.</p>
                    </div>
                )}

                {visible.map(item => (
                    <div key={item.id} className="n-proactive">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                            <div style={{ flex: 1 }}>
                                <p className="n-proactive-title">{item.title}</p>
                                <p className="n-proactive-reason" style={{ marginTop: '4px' }}>{item.reason}</p>
                            </div>
                            <span className={`n-tag ${item.priority}`}>{item.priority}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                            <button className="n-btn primary">Review</button>
                            <button className="n-btn" onClick={() => setDismissed(prev => new Set(prev).add(item.id))}>Dismiss</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="n-panel">
                <span className="n-panel-title">Quick Actions</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                    <button className="n-btn">Lock doors</button>
                    <button className="n-btn">Quiet mode</button>
                    <button className="n-btn">Evening reset</button>
                    <button className="n-btn">Set 10m timer</button>
                </div>
            </div>
        </div>
    )
}
