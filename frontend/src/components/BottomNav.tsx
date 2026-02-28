import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Activity, Timer, Zap, MoreHorizontal, BarChart3, Heart, Mic, Users, Settings } from 'lucide-react'
import './BottomNav.css'

const mainTabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/activity', icon: Activity, label: 'Activity' },
    { path: '/timers', icon: Timer, label: 'Timers' },
    { path: '/automations', icon: Zap, label: 'Auto' },
]

const moreTabs = [
    { path: '/summary', icon: BarChart3, label: 'Summary' },
    { path: '/health', icon: Heart, label: 'Health' },
    { path: '/voice', icon: Mic, label: 'Voice' },
    { path: '/household', icon: Users, label: 'Household' },
    { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
    const location = useLocation()
    const navigate = useNavigate()
    const [moreOpen, setMoreOpen] = useState(false)

    const isMoreActive = moreTabs.some(t => t.path === location.pathname)

    return (
        <>
            {moreOpen && <div className="more-overlay" onClick={() => setMoreOpen(false)} />}
            <nav className="bottom-nav">
                {moreOpen && (
                    <div className="more-menu fade-in">
                        {moreTabs.map(tab => (
                            <button
                                key={tab.path}
                                className={`more-item ${location.pathname === tab.path ? 'active' : ''}`}
                                onClick={() => { navigate(tab.path); setMoreOpen(false) }}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div className="nav-items">
                    {mainTabs.map(tab => (
                        <button
                            key={tab.path}
                            className={`nav-item ${location.pathname === tab.path ? 'active' : ''}`}
                            onClick={() => { navigate(tab.path); setMoreOpen(false) }}
                        >
                            <tab.icon size={20} />
                            <span className="nav-label">{tab.label}</span>
                        </button>
                    ))}
                    <button
                        className={`nav-item ${isMoreActive ? 'active' : ''}`}
                        onClick={() => setMoreOpen(!moreOpen)}
                    >
                        <MoreHorizontal size={20} />
                        <span className="nav-label">More</span>
                    </button>
                </div>
            </nav>
        </>
    )
}
