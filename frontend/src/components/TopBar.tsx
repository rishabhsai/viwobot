import { Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import './TopBar.css'

const pageTitles: Record<string, string> = {
    '/': '',
    '/activity': 'Activity',
    '/timers': 'Timers',
    '/automations': 'Automations',
    '/summary': 'Summary',
    '/health': 'Health',
    '/voice': 'Voice',
    '/household': 'Household',
    '/settings': 'Settings',
}

export default function TopBar() {
    const location = useLocation()
    const title = pageTitles[location.pathname] || ''
    const isHome = location.pathname === '/'

    const now = new Date()
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

    return (
        <header className="topbar">
            <div className="topbar-left">
                {isHome ? (
                    <div className="topbar-greeting">
                        <span className="greeting-text">{greeting}</span>
                        <span className="greeting-name">Rishabh</span>
                    </div>
                ) : (
                    <h1 className="topbar-title">{title}</h1>
                )}
            </div>
            <div className="topbar-right">
                <button className="topbar-bell" aria-label="Notifications">
                    <Bell size={20} />
                    <span className="bell-badge">3</span>
                </button>
                <div className="topbar-avatar">
                    <span>R</span>
                </div>
            </div>
        </header>
    )
}
