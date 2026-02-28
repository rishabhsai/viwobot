import { useState } from 'react'
import { Heart, Calendar, Home as HomeIcon, Shield, Eye, Cpu, Wifi, WifiOff, ChevronRight, Info, Moon, Bell } from 'lucide-react'
import '../styles/settings.css'

interface SettingToggle {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    defaultOn: boolean;
    category: string;
}

const settings: SettingToggle[] = [
    { id: 's1', label: 'Apple Health', description: 'Allow access to heart rate, HRV, sleep, and activity data', icon: <Heart size={16} />, defaultOn: true, category: 'Data Sources' },
    { id: 's2', label: 'Calendar', description: 'Read calendar events for scheduling suggestions', icon: <Calendar size={16} />, defaultOn: true, category: 'Data Sources' },
    { id: 's3', label: 'HomeKit', description: 'Control smart home devices via HomeKit', icon: <HomeIcon size={16} />, defaultOn: true, category: 'Data Sources' },
    { id: 's4', label: 'Always Show Why', description: 'Show explanation for every proactive suggestion', icon: <Eye size={16} />, defaultOn: true, category: 'Privacy' },
    { id: 's5', label: 'On-Device Processing', description: 'Process sensitive data locally when possible', icon: <Cpu size={16} />, defaultOn: true, category: 'Privacy' },
    { id: 's6', label: 'Cloud Processing', description: 'Allow cloud processing for complex AI tasks', icon: <Shield size={16} />, defaultOn: false, category: 'Privacy' },
    { id: 's7', label: 'Offline Fallback', description: 'Keep critical automations running without internet', icon: <WifiOff size={16} />, defaultOn: true, category: 'Reliability' },
    { id: 's8', label: 'Auto Wi-Fi Reconnect', description: 'Automatically reconnect devices on network drop', icon: <Wifi size={16} />, defaultOn: true, category: 'Reliability' },
    { id: 's9', label: 'Dark Mode', description: 'Use dark theme throughout the app', icon: <Moon size={16} />, defaultOn: true, category: 'Appearance' },
    { id: 's10', label: 'Push Notifications', description: 'Receive alerts for automations and suggestions', icon: <Bell size={16} />, defaultOn: true, category: 'Notifications' },
]

export default function Settings() {
    const [toggles, setToggles] = useState<Record<string, boolean>>(
        Object.fromEntries(settings.map(s => [s.id, s.defaultOn]))
    )

    const toggle = (id: string) => {
        setToggles(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const categories = [...new Set(settings.map(s => s.category))]

    return (
        <div className="settings-page fade-in">
            {/* ── Profile Card ── */}
            <div className="profile-card glass-card">
                <div className="profile-avatar">
                    <span>R</span>
                </div>
                <div className="profile-info">
                    <span className="profile-name">Rishabh</span>
                    <span className="profile-email">rishabh@openclaw.ai</span>
                </div>
                <ChevronRight size={16} className="profile-arrow" />
            </div>

            {/* ── Settings Groups ── */}
            {categories.map(cat => (
                <section key={cat} className="settings-group">
                    <h2 className="section-title">{cat}</h2>
                    <div className="settings-list">
                        {settings.filter(s => s.category === cat).map(s => (
                            <div key={s.id} className="setting-item glass-card">
                                <div className="setting-icon">{s.icon}</div>
                                <div className="setting-info">
                                    <span className="setting-label">{s.label}</span>
                                    <span className="setting-desc">{s.description}</span>
                                </div>
                                <button className={`setting-toggle ${toggles[s.id] ? 'on' : 'off'}`} onClick={() => toggle(s.id)}>
                                    <div className="toggle-knob" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            {/* ── Info ── */}
            <div className="settings-footer">
                <div className="footer-item">
                    <Info size={14} />
                    <span>OpenClaw v1.0.0</span>
                </div>
                <div className="footer-item">
                    <Shield size={14} />
                    <span>Your data is encrypted end-to-end</span>
                </div>
            </div>
        </div>
    )
}
