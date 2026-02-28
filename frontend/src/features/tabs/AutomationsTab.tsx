import { useState } from 'react'
import BottomSheet from '../primitives/BottomSheet'
import Panel from '../primitives/Panel'
import type { AutomationItem } from '../types'

type AutomationsTabProps = {
    automations: AutomationItem[]
}

export default function AutomationsTab({ automations }: AutomationsTabProps) {
    const [prompt, setPrompt] = useState('')
    const [selectedAutomation, setSelectedAutomation] = useState<AutomationItem | null>(null)

    return (
        <section className="tab-content" style={{ paddingBottom: '2rem' }}>
            <Panel title="Automations" subtitle="Create or manage Nova's automated routines">
                <label className="field" htmlFor="automation-builder">
                    Ask Nova to create an automation
                    <div className="capture-row">
                        <input
                            id="automation-builder"
                            className="capture-field"
                            type="text"
                            value={prompt}
                            placeholder="e.g. When I leave, turn off all lights..."
                            onChange={(event) => setPrompt(event.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && prompt.trim()) {
                                    setPrompt('')
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn solid capture-submit"
                            onClick={() => setPrompt('')}
                            disabled={!prompt.trim()}
                        >
                            Create
                        </button>
                    </div>
                </label>
            </Panel>

            <Panel title="Your Automations">
                {automations.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-title">No automations yet</p>
                        <p className="empty-description">Create your first routine to save time.</p>
                    </div>
                ) : (
                    <div className="stack">
                        {automations.map((item) => (
                            <article
                                className="card-row"
                                key={item.id}
                                onClick={() => setSelectedAutomation(item)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="card-title-line">
                                    <h3>{item.title}</h3>
                                    <span className="muted" style={{ fontSize: '1.2rem', lineHeight: 1 }}>
                                        ›
                                    </span>
                                </div>
                                <p className="muted" style={{ marginTop: '0.2rem' }}>
                                    {item.trigger}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </Panel>

            <BottomSheet
                open={Boolean(selectedAutomation)}
                title={selectedAutomation?.title || 'Automation'}
                onClose={() => setSelectedAutomation(null)}
            >
                <p className="reason-detail" style={{ marginBottom: '1rem', marginTop: 0 }}>
                    {selectedAutomation?.description}
                </p>

                <div className="stack" style={{ marginBottom: '1.5rem' }}>
                    {selectedAutomation?.steps.map((step, index) => (
                        <div
                            key={step.id}
                            className="item-row"
                            style={{
                                gridTemplateColumns: 'auto 1fr',
                                background: 'transparent',
                                borderColor: 'var(--line-2)',
                            }}
                        >
                            <div
                                style={{
                                    width: '1.5rem',
                                    height: '1.5rem',
                                    borderRadius: '50%',
                                    background: 'var(--bg-2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'var(--text-2)',
                                }}
                            >
                                {index + 1}
                            </div>
                            <div>
                                <p className="item-text" style={{ fontWeight: 500 }}>
                                    {step.action}
                                </p>
                                <p className="muted" style={{ fontSize: '0.7rem' }}>
                                    {step.target}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sheet-actions">
                    <button type="button" className="btn solid" style={{ flex: 1 }}>
                        Run now
                    </button>
                    <button type="button" className="btn ghost" style={{ flex: 1 }}>
                        Edit
                    </button>
                </div>
            </BottomSheet>
        </section>
    )
}
