import { ChevronLeft, Pin } from 'lucide-react'
import { initialMemories } from '../features/data/mockData'

export default function TestMemories({ onBack }: { onBack: () => void }) {
    return (
        <div className="test-subview-container">
            <header className="integrations-header">
                <button type="button" className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Memories</h2>
                <div style={{ width: 24 }} />
            </header>

            <main className="integrations-content">
                <section className="integration-section">
                    <h3>Context & Preferences</h3>
                    {initialMemories.map((memory) => (
                        <div key={memory.id} className="memory-card">
                            <div className="memory-header">
                                <span className="memory-category">{memory.category}</span>
                                {memory.pinned && <Pin size={14} color="#888" />}
                            </div>
                            <p className="memory-text">{memory.text}</p>
                            <span className="memory-source">{memory.source}</span>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    )
}
