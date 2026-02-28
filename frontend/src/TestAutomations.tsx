import { useState } from 'react'
import { ChevronLeft, Plus, Loader2 } from 'lucide-react'
import { initialAutomations } from './features/data/mockData'
import { useNovaBackend } from './useNovaBackend'

export default function TestAutomations({ onBack }: { onBack: () => void }) {
    const { generateAutomation } = useNovaBackend()
    const [automations, setAutomations] = useState(initialAutomations)
    const [prompt, setPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!prompt.trim() || isGenerating) return
        setIsGenerating(true)
        const newAutomation = await generateAutomation(prompt)
        setIsGenerating(false)
        if (newAutomation) {
            setAutomations(prev => [newAutomation, ...prev])
            setPrompt('')
        }
    }
    return (
        <div className="test-subview-container">
            <header className="integrations-header">
                <button type="button" className="back-btn" onClick={onBack}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Automations</h2>
                <div style={{ width: 24 }} />
            </header>

            <main className="integrations-content">
                <section className="integration-section">
                    <div className="create-automation-row">
                        <input
                            type="text"
                            placeholder={isGenerating ? "Generating..." : "Ask Nova to automate something..."}
                            className="create-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleGenerate()
                            }}
                            disabled={isGenerating}
                        />
                        <button
                            type="button"
                            className="create-btn"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={20} />}
                        </button>
                    </div>
                </section>

                <section className="integration-section">
                    <h3>Your Workflows</h3>
                    {automations.map((automation) => (
                        <div key={automation.id} className="workflow-card">
                            <div className="workflow-title-row">
                                <h4>{automation.title}</h4>
                                <span className="badge">{automation.steps.length} steps</span>
                            </div>
                            <p className="muted">{automation.description}</p>

                            <div className="workflow-steps">
                                {automation.steps.map((step, index) => (
                                    <div key={step.id} className="step-row">
                                        <span className="step-number">{index + 1}</span>
                                        <span className="step-action">{step.action}</span>
                                        <span className="step-target">{step.target}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </main>
        </div>
    )
}
