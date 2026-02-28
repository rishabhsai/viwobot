import { useState, useMemo } from 'react'
import './nova.css'
import type { TabKey } from './data'
import HomeTab from './tabs/HomeTab'
import ListsTab from './tabs/ListsTab'
import TimersTab from './tabs/TimersTab'
import InboxTab from './tabs/InboxTab'
import MemoriesTab from './tabs/MemoriesTab'

// Order requested: Home, Lists, Timers, Inbox, Memories
const tabs: { id: TabKey; label: string; badge?: boolean }[] = [
    { id: 'home', label: 'Home' },
    { id: 'lists', label: 'Lists' },
    { id: 'timers', label: 'Timers' },
    { id: 'inbox', label: 'Inbox', badge: true },
    { id: 'memories', label: 'Memories' }
]

export default function NovaApp() {
    const [tab, setTab] = useState<TabKey>('home')

    const page = useMemo(() => {
        switch (tab) {
            case 'home': return <HomeTab />
            case 'lists': return <ListsTab />
            case 'timers': return <TimersTab />
            case 'inbox': return <InboxTab />
            case 'memories': return <MemoriesTab />
        }
    }, [tab])

    return (
        <div className="nova">
            <header className="nova-header">
                <span className="nova-wordmark">Nova</span>
            </header>

            <div className="nova-body">
                {page}
            </div>

            <nav className="nova-nav">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        className={`nova-nav-btn ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}
                    >
                        <NavIcon id={t.id} />
                        {t.label}
                        {t.badge && <span className="nova-nav-badge" />}
                    </button>
                ))}
            </nav>
        </div>
    )
}

function NavIcon({ id }: { id: TabKey }) {
    const s = 20
    const sw = 1.5
    switch (id) {
        case 'home': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        case 'lists': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
        case 'timers': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><polyline points="12 9 12 13 14 15" /><path d="M5 3L2 6" /><path d="M22 6l-3-3" /><path d="M12 2v2" /></svg>
        case 'inbox': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
        case 'memories': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
    }
}
