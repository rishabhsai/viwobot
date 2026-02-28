import { useMemo, useState } from 'react'
import BottomSheet from '../primitives/BottomSheet'
import Chip from '../primitives/Chip'
import Panel from '../primitives/Panel'
import type { MemoryCategory, MemoryItem } from '../types'

type MemoriesTabProps = {
  memories: MemoryItem[]
  onTogglePin: (id: string) => void
  onForget: (id: string) => void
}

const filters: Array<'All' | MemoryCategory> = [
  'All',
  'People',
  'Places',
  'Routines',
  'Preferences',
]

export default function MemoriesTab({ memories, onTogglePin, onForget }: MemoriesTabProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | MemoryCategory>('All')
  const [pendingForgetId, setPendingForgetId] = useState<string | null>(null)

  const visibleMemories = useMemo(() => {
    const filteredByCategory =
      filter === 'All' ? memories : memories.filter((memory) => memory.category === filter)

    const query = search.trim().toLowerCase()
    if (!query) {
      return filteredByCategory
    }

    return filteredByCategory.filter((memory) => {
      return (
        memory.text.toLowerCase().includes(query) ||
        memory.source.toLowerCase().includes(query) ||
        memory.category.toLowerCase().includes(query)
      )
    })
  }, [filter, memories, search])

  const pinned = visibleMemories.filter((memory) => memory.pinned)
  const timeline = visibleMemories.filter((memory) => !memory.pinned)
  const pendingForgetMemory = memories.find((memory) => memory.id === pendingForgetId)

  return (
    <section className="tab-content">
      <Panel title="Memories" subtitle="What Nova has learned and remembered">
        <label className="field" htmlFor="memory-search">
          Search memories
          <input
            id="memory-search"
            type="text"
            value={search}
            placeholder="Search what Nova remembers"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="chip-row" role="tablist" aria-label="Memory categories">
          {filters.map((entry) => (
            <Chip
              key={entry}
              label={entry}
              active={filter === entry}
              onClick={() => setFilter(entry)}
            />
          ))}
        </div>
      </Panel>

      {pinned.length > 0 && (
        <Panel title="Pinned">
          <div className="stack">
            {pinned.map((memory) => (
              <article className="card-row" key={memory.id}>
                <p>{memory.text}</p>
                <p className="muted">{memory.source}</p>
                <p className="muted">{memory.updatedAt}</p>
                <div className="card-actions">
                  <button type="button" className="btn ghost" onClick={() => onTogglePin(memory.id)}>
                    Unpin
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setPendingForgetId(memory.id)}
                  >
                    Forget
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Timeline">
        {timeline.length === 0 ? (
          <p className="muted">No memories match your search or filter.</p>
        ) : (
          <div className="stack">
            {timeline.map((memory) => (
              <article className="card-row" key={memory.id}>
                <p>{memory.text}</p>
                <p className="muted">{memory.category}</p>
                <p className="muted">{memory.source}</p>
                <p className="muted">{memory.updatedAt}</p>
                <div className="card-actions">
                  <button type="button" className="btn ghost" onClick={() => onTogglePin(memory.id)}>
                    Pin
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setPendingForgetId(memory.id)}
                  >
                    Forget
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <BottomSheet
        open={Boolean(pendingForgetMemory)}
        title="Forget memory"
        onClose={() => setPendingForgetId(null)}
      >
        <p className="muted">
          Remove this memory from Nova? This action can be undone from the toast.
        </p>
        {pendingForgetMemory && <p className="sheet-highlight">{pendingForgetMemory.text}</p>}
        <div className="sheet-actions">
          <button
            type="button"
            className="btn solid"
            onClick={() => {
              if (!pendingForgetId) {
                return
              }
              onForget(pendingForgetId)
              setPendingForgetId(null)
            }}
          >
            Forget memory
          </button>
          <button type="button" className="btn ghost" onClick={() => setPendingForgetId(null)}>
            Cancel
          </button>
        </div>
      </BottomSheet>
    </section>
  )
}
