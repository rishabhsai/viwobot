import { useState } from 'react'
import { inboxItems } from '../data'

export default function InboxTab() {
    const [items, setItems] = useState(inboxItems)
    const [sourcesConnected, setSourcesConnected] = useState(false)

    const dismiss = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

    return (
        <div className="n-section-gap">
            {!sourcesConnected && (
                <div className="n-panel">
                    <p className="n-panel-title">Connect Sources</p>
                    <p className="n-meta">Link accounts to let Nova summarize actionable items.</p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                        <span className="n-tag">Email</span>
                        <span className="n-tag">Calendar</span>
                        <span className="n-tag">HomeKit</span>
                    </div>
                    <button className="n-btn primary" onClick={() => setSourcesConnected(true)}>Connect All Mock</button>
                </div>
            )}

            <div className="n-panel" style={{ padding: 0 }}>
                <div className="n-panel-head" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>
                    <span className="n-panel-title">Action Queue</span>
                    <span className="n-meta">{items.length} pending</span>
                </div>

                {items.length === 0 && (
                    <div className="n-empty">
                        <p className="n-empty-title">Inbox Zero</p>
                    </div>
                )}

                {items.map(item => (
                    <div key={item.id} className="n-proactive">
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="n-meta">{item.source}</span>
                        </div>
                        <div>
                            <p className="n-proactive-title">{item.title}</p>
                            <p className="n-proactive-reason" style={{ marginTop: '2px' }}>{item.detail}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                            <button className="n-btn primary" onClick={() => dismiss(item.id)}>Approve</button>
                            <button className="n-btn" onClick={() => dismiss(item.id)}>Dismiss</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
