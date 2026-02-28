import { useState } from 'react'
import TestHome from './TestHome'
import TestIntegrations from './TestIntegrations'
import TestAutomations from './TestAutomations'
import TestMemories from './TestMemories'
import TestLists from './TestLists'
import './test.css'

export type TestViewMode = 'home' | 'integrations' | 'automations' | 'memories' | 'lists'

export default function TestApp() {
    const [view, setView] = useState<TestViewMode>('home')

    const goHome = () => setView('home')

    if (view === 'integrations') return <TestIntegrations onBack={goHome} />
    if (view === 'automations') return <TestAutomations onBack={goHome} />
    if (view === 'memories') return <TestMemories onBack={goHome} />
    if (view === 'lists') return <TestLists onBack={goHome} />

    return <TestHome onViewChange={setView} />
}
