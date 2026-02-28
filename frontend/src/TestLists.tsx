import { ChevronLeft, Circle, CheckCircle } from 'lucide-react'
import { initialListGroups } from './features/data/mockData'

export default function TestLists({ onBack }: { onBack: () => void }) {
    return (
        <div className="test-subview-container">
            <header className="integrations-header">
                <button type="button" className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Todos & Lists</h2>
                <div style={{ width: 24 }} />
            </header>

            <main className="integrations-content">
                {initialListGroups.map((group) => (
                    <section key={group.id} className="integration-section">
                        <h3>{group.name}</h3>
                        <div className="list-group">
                            {group.items.map((item) => (
                                <div key={item.id} className="list-item-row">
                                    {item.done ? (
                                        <CheckCircle size={20} color="#4ade80" />
                                    ) : (
                                        <Circle size={20} color="#ccc" />
                                    )}
                                    <span className={item.done ? "item-text item-done" : "item-text"}>{item.text}</span>
                                </div>
                            ))}
                        </div>
                        <button type="button" className="add-btn" style={{ marginTop: '0.5rem' }}>
                            <span>+ Add item to {group.name.toLowerCase()}</span>
                        </button>
                    </section>
                ))}
            </main>
        </div>
    )
}
