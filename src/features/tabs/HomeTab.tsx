import { useState } from 'react'
import Panel from '../primitives/Panel'
import EmptyState from '../primitives/EmptyState'
import type { ProactiveItem, TimerItem } from '../types'

type HomeTabProps = {
  statusLine: string
  quickControls: string[]
  items: ProactiveItem[]
  timers: TimerItem[]
  onDismiss: (itemId: string) => void
}

export default function HomeTab({ statusLine, quickControls, items, timers, onDismiss }: HomeTabProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  return (
    <section className="tab-content">
      <Panel>
        <p className="status-line">{statusLine}</p>
      </Panel>

      {timers.filter((t) => t.status === 'running').length > 0 && (
        <Panel title="Active timers">
          <div className="stack">
            {timers
              .filter((t) => t.status === 'running')
              .map((timer) => (
                <div key={timer.id} className="card-row">
                  <div className="card-title-line">
                    <h3 style={{ fontSize: '1.2rem' }}>
                      {Math.floor(timer.remainingSeconds / 60)}:
                      {(timer.remainingSeconds % 60).toString().padStart(2, '0')}
                    </h3>
                    <span className="badge">Running</span>
                  </div>
                  <p className="muted" style={{ marginTop: '0.2rem' }}>
                    {timer.label}
                  </p>
                </div>
              ))}
          </div>
        </Panel>
      )}

      {items.length === 0 ? (
        <Panel>
          <EmptyState
            title="No proactive items"
            description="Nova will add suggestions here when new actions need your attention."
          />
        </Panel>
      ) : (
        <div
          className="swipe-carousel"
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            gap: '0.65rem',
            paddingBottom: '0.4rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            margin: '0.5rem 0',
          }}
        >
          {items.slice(0, 5).map((item) => {
            const expanded = expandedItemId === item.id
            return (
              <article
                key={item.id}
                className="card-row carousel-item"
                style={{
                  flex: '0 0 85%',
                  scrollSnapAlign: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div className="card-title-line">
                    <h3>{item.title}</h3>
                    <div className="meta-badges">
                      <span className="badge">{item.priority}</span>
                    </div>
                  </div>
                  <p className="muted">{item.reason}</p>
                  <button
                    type="button"
                    className="link"
                    onClick={() => setExpandedItemId(expanded ? null : item.id)}
                  >
                    Why this?
                  </button>
                  {expanded && (
                    <p className="reason-detail">
                      Nova prioritized this suggestion based on recent behavior and timing patterns.
                    </p>
                  )}
                </div>
                <div className="card-actions">
                  <button type="button" className="btn solid">
                    {item.actions.primary}
                  </button>
                  <button type="button" className="btn ghost" onClick={() => onDismiss(item.id)}>
                    {item.actions.secondary}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Panel title="Quick controls">
        <div className="quick-grid">
          {quickControls.slice(0, 4).map((control) => (
            <button key={control} type="button" className="btn ghost action-btn">
              {control}
            </button>
          ))}
        </div>
      </Panel>
    </section>
  )
}
