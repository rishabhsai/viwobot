import { useState } from 'react'
import { listsData } from '../data'

export default function ListsTab() {
    const [items, setItems] = useState(listsData)
    const [newItem, setNewItem] = useState('')

    const pending = items.filter(i => !i.done)
    const done = items.filter(i => i.done)

    const toggle = (id: string) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))
    }

    const add = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItem.trim()) return
        setItems([{ id: Date.now().toString(), text: newItem.trim(), done: false }, ...items])
        setNewItem('')
    }

    const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

    return (
        <div className="n-section-gap">
            <form onSubmit={add} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                    className="n-input"
                    placeholder="I need to..."
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                />
                <button type="submit" className="n-btn primary">Add</button>
            </form>

            <div className="n-panel" style={{ padding: 0 }}>
                <div className="n-panel-head" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>
                    <span className="n-panel-title">Todos</span>
                    <span className="n-meta">{pending.length}</span>
                </div>

                {pending.length === 0 && (
                    <div className="n-empty">
                        <p className="n-empty-title">All done</p>
                    </div>
                )}

                {pending.map(item => (
                    <div key={item.id} className="n-proactive" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <button className="n-check" onClick={() => toggle(item.id)} />
                        <span className="n-check-label" style={{ flex: 1 }}>{item.text}</span>
                        <button className="n-icon-btn" onClick={() => remove(item.id)}>✕</button>
                    </div>
                ))}
            </div>

            {done.length > 0 && (
                <div className="n-panel" style={{ padding: 0 }}>
                    <div className="n-panel-head" style={{ padding: 'var(--space-4) var(--space-5) 0' }}>
                        <span className="n-panel-title">Completed</span>
                    </div>
                    {done.map(item => (
                        <div key={item.id} className="n-proactive" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <button className="n-check checked" onClick={() => toggle(item.id)}>✓</button>
                            <span className="n-check-label done" style={{ flex: 1 }}>{item.text}</span>
                            <button className="n-icon-btn" onClick={() => remove(item.id)}>✕</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
