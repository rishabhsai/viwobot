import { ChevronLeft, UserPlus, Blocks } from 'lucide-react'

export default function TestIntegrations({ onBack }: { onBack: () => void }) {
    return (
        <div className="test-integrations-container">
            <header className="integrations-header">
                <button type="button" className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Connections</h2>
                <div style={{ width: 24 }} />
            </header>

            <main className="integrations-content">
                <section className="integration-section">
                    <h3>Email Accounts</h3>
                    <div className="integration-card">
                        <div className="account-avatar">R</div>
                        <span className="account-email">rishabhsaiv@gmail.com</span>
                        <span className="account-badge">Primary</span>
                        <span className="arrow">›</span>
                    </div>
                    <button type="button" className="add-btn">
                        <UserPlus size={18} />
                        <span>Add Account</span>
                    </button>
                </section>

                <section className="integration-section">
                    <h3>Integrations</h3>
                    <div className="integration-card">
                        <div className="integration-icon">
                            <Blocks size={16} color="white" />
                        </div>
                        <span className="integration-name">Canvas</span>
                        <div className="status-dot" />
                        <span className="arrow">›</span>
                    </div>
                    <button type="button" className="add-btn">
                        <Blocks size={18} />
                        <span>Add Integration</span>
                    </button>
                </section>
            </main>
        </div>
    )
}
