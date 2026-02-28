import {
    SquareDashedKanban,
    Workflow,
    LayoutGrid,
    ListTodo,
    MessageCircle,
    BatteryMedium,
    Clock,
    Sparkles,
    ChevronRight
} from 'lucide-react'
import { type TestViewMode } from './TestApp'
import { initialProactiveItems } from '../features/data/mockData'

export default function TestHome({ onViewChange }: { onViewChange: (view: TestViewMode) => void }) {

    return (
        <div className="test-home-container">
            <div className="test-header">
                <div style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.5px' }}>
                    Nova
                </div>
                <div className="header-center">
                    <div className="status-top">
                        <span className="battery">
                            <BatteryMedium size={14} color="#555" /> 98%
                        </span>
                    </div>
                    <span className="date-text">Fri, Feb 27</span>
                </div>
                <button type="button" className="avatar-btn">
                    R
                </button>
            </div>

            <div className="test-content">
                <div className="greeting-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>

                    {/* Centered Large Timer */}
                    <div style={{
                        background: 'rgba(255,255,255,0.6)',
                        backdropFilter: 'blur(20px)',
                        padding: '1rem 1.5rem',
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ color: '#f97316', fontWeight: 700, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={24} /> 25:00
                        </div>
                        <div style={{ color: '#555', fontSize: '0.9rem', fontWeight: 500 }}>
                            Hackathon submission due
                        </div>
                    </div>

                    <h2>Good evening, Rishabh</h2>
                    <p>39°F and clear sky</p>
                </div>

                {/* Proactive Carousel */}
                <div className="proactive-carousel" style={{
                    display: 'flex',
                    gap: '1rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    marginBottom: '1rem',
                    scrollbarWidth: 'none', /* Firefox */
                }}>
                    {initialProactiveItems.map((item) => (
                        <div key={item.id} style={{
                            minWidth: '220px',
                            background: 'rgba(255,255,255,0.7)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '20px',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>
                                <Sparkles size={14} />
                                {item.title}
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#333', lineHeight: 1.3 }}>
                                {item.reason}
                            </div>
                            <button style={{
                                marginTop: 'auto',
                                background: 'transparent',
                                border: 'none',
                                color: '#111',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                padding: 0,
                                cursor: 'pointer'
                            }}>
                                Review <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="actions-grid">
                    <div className="grid-row-2">
                        <button type="button" className="action-card" onClick={() => onViewChange('automations')}>
                            <Workflow size={24} />
                            <span>Automations</span>
                        </button>
                        <button type="button" className="action-card" onClick={() => onViewChange('integrations')}>
                            <SquareDashedKanban size={24} />
                            <span>Integrations</span>
                        </button>
                    </div>

                    <div className="grid-row-3">
                        <button type="button" className="action-card" onClick={() => onViewChange('memories')}>
                            <LayoutGrid size={24} />
                            <span>Memories</span>
                        </button>
                        <button type="button" className="action-card" onClick={() => onViewChange('lists')}>
                            <ListTodo size={24} />
                            <span>Todos & Lists</span>
                        </button>
                        <button type="button" className="action-card">
                            <MessageCircle size={24} />
                            <span>Text Nova</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
