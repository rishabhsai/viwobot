import { useState } from 'react'
import TestHome from './TestHome'
import TestIntegrations from './TestIntegrations'
import TestAutomations from './TestAutomations'
import TestMemories from './TestMemories'
import TestLists from './TestLists'
import { useNovaBackend } from './useNovaBackend'
import './test.css'

export type TestViewMode = 'home' | 'integrations' | 'automations' | 'memories' | 'lists'

export default function TestApp() {
    const [view, setView] = useState<TestViewMode>('home')
    const backend = useNovaBackend()

    const goHome = () => setView('home')

    let currentView = null
    if (view === 'integrations') currentView = <TestIntegrations onBack={goHome} />
    else if (view === 'automations') currentView = <TestAutomations onBack={goHome} />
    else if (view === 'memories') currentView = <TestMemories onBack={goHome} />
    else if (view === 'lists') currentView = <TestLists onBack={goHome} />
    else currentView = <TestHome onViewChange={setView} status={backend.status} connected={backend.connected} reminders={backend.reminders} />

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Global Connection & Status overlay */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                display: 'flex', flexDirection: 'column',
                pointerEvents: 'none'
            }}>
                <div style={{
                    background: backend.connected ? '#4ade8020' : '#f8717120',
                    color: backend.connected ? '#16a34a' : '#dc2626',
                    fontSize: '0.7rem', fontWeight: 600,
                    textAlign: 'center', padding: '2px 0',
                    textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                    {backend.connected ? '● Live' : '○ Offline'}
                </div>
                {backend.status.state !== 'idle' && (
                    <div style={{
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)',
                        padding: '8px 16px',
                        borderBottom: '1px solid #ddd',
                        fontSize: '0.85rem', color: '#333',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: 500,
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: backend.status.state === 'listening' ? '#4ade80' :
                                backend.status.state === 'thinking' ? '#facc15' :
                                    backend.status.state === 'speaking' ? '#60a5fa' : '#fb923c',
                            animation: 'pulse 1.5s infinite'
                        }} />
                        <span>
                            {backend.status.state === 'listening' && 'Nova is listening...'}
                            {backend.status.state === 'thinking' && `Thinking: "${backend.status.transcript || '...'}"`}
                            {backend.status.state === 'speaking' && `Speaking: "${backend.status.response || '...'}"`}
                            {backend.status.state === 'reminder' && `Reminder: ${backend.status.message}`}
                        </span>
                    </div>
                )}
            </div>

            {/* Main View */}
            <div style={{ paddingTop: backend.status.state !== 'idle' ? '40px' : '0', transition: 'padding 0.3s' }}>
                {currentView}
            </div>
        </div>
    )
}
