import { useState } from 'react'
import { memories } from '../data'

export default function MemoriesTab() {
    const [items, setItems] = useState(memories)
    const [search, setSearch] = useState('')

    const filtered = items.filter(i => i.text.toLowerCase().includes(search.toLowerCase()))
    const pinned = filtered.filter(i => i.pinned)
    const unpinned = filtered.filter(i => !i.pinned)

    const togglePin = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, pinned: !i.pinned } : i))
    const forget = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

    return (
        <div className="n-section-gap">
            <input
                className="n-input"
                placeholder="Search what Nova remembers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />

            <div className="n-panel" style={{ padding: 0 }}>
                <div className="n-panel-head" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>
                    <span className="n-panel-title">Saved Memories</span>
                    <span className="n-meta">{filtered.length} total</span>
                </div>

                {pinned.map(m => (
                    <MemoryRow key={m.id} m={m} toggle={togglePin} forget={forget} />
                ))}
                {unpinned.map(m => (
                    <MemoryRow key={m.id} m={m} toggle={togglePin} forget={forget} />
                ))}
                {filtered.length === 0 && (
                    <div className="n-empty">
                        <p className="n-empty-title">No results</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function MemoryRow({ m, toggle, forget }: any) {
    return (
        <div className="n-proactive">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p className="n-label" style={{ flex: 1, paddingRight: 'var(--space-3)' }}>{m.text}</p>
                {m.pinned && <span className="n-tag high">Pinned</span>}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <button className="n-btn" onClick={() => toggle(m.id)}>{m.pinned ? 'Unpin' : 'Pin'}</button>
                <button className="n-btn" style={{ color: '#ef4444', borderColor: '#fecaca' }} onClick={() => forget(m.id)}>Forget</button>
            </div>
        </div>
    )
}
