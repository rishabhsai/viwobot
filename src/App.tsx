import { useEffect, useRef, useState } from 'react'
import {
  initialAutomations,
  initialListGroups,
  initialMemories,
  initialProactiveItems,
  initialReminders,
  initialTimers,
  quickControls,
} from './features/data/mockData'
import BottomSheet from './features/primitives/BottomSheet'
import UndoToast from './features/primitives/UndoToast'
import AutomationsTab from './features/tabs/AutomationsTab'
import HomeTab from './features/tabs/HomeTab'
import ListsTab from './features/tabs/ListsTab'
import MemoriesTab from './features/tabs/MemoriesTab'
import TimersTab from './features/tabs/TimersTab'
import type { TabKey, UndoRequest } from './features/types'

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'timers', label: 'Timers' },
  { id: 'lists', label: 'Lists' },
  { id: 'automations', label: 'Automations' },
  { id: 'memories', label: 'Memories' },
]

type UndoState = {
  id: string
  label: string
  undo: () => void
}


function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [proactiveItems, setProactiveItems] = useState(initialProactiveItems)
  const [memories, setMemories] = useState(initialMemories)
  const [timers, setTimers] = useState(initialTimers)
  const [reminders, setReminders] = useState(initialReminders)
  const [listGroups, setListGroups] = useState(initialListGroups)
  const [automations] = useState(initialAutomations)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [privacyOnDevice, setPrivacyOnDevice] = useState(true)
  const [privacyRetention, setPrivacyRetention] = useState(false)
  const [undoState, setUndoState] = useState<UndoState | null>(null)

  const undoTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current !== null) {
        window.clearTimeout(undoTimeoutRef.current)
      }
    }
  }, [])

  const requestUndo = (request: UndoRequest) => {
    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current)
    }

    const nextState: UndoState = {
      id: `${Date.now()}`,
      label: request.label,
      undo: request.undo,
    }

    setUndoState(nextState)

    undoTimeoutRef.current = window.setTimeout(() => {
      setUndoState((current) => (current?.id === nextState.id ? null : current))
    }, 7000)
  }

  const dismissProactiveItem = (itemId: string) => {
    const item = proactiveItems.find((entry) => entry.id === itemId)
    if (!item) {
      return
    }

    setProactiveItems((previous) => previous.filter((entry) => entry.id !== itemId))
    requestUndo({
      label: 'Proactive item dismissed',
      undo: () => {
        setProactiveItems((previous) => [item, ...previous])
      },
    })
  }

  const togglePinMemory = (id: string) => {
    setMemories((previous) =>
      previous.map((memory) => (memory.id === id ? { ...memory, pinned: !memory.pinned } : memory)),
    )
  }

  const forgetMemory = (id: string) => {
    const memory = memories.find((entry) => entry.id === id)
    if (!memory) {
      return
    }

    setMemories((previous) => previous.filter((entry) => entry.id !== id))
    requestUndo({
      label: 'Memory removed',
      undo: () => {
        setMemories((previous) => [memory, ...previous])
      },
    })
  }



  return (
    <div className="app-shell">
      <header className="top-header" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div
            style={{
              width: '18px',
              height: '10px',
              border: '1.5px solid #22c55e',
              borderRadius: '2px',
              position: 'relative',
            }}
            aria-label="Online"
          >
            <div
              style={{
                position: 'absolute',
                top: '1px',
                bottom: '1px',
                left: '1px',
                right: '1px',
                background: '#22c55e',
                borderRadius: '1px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '-3px',
                top: '2px',
                bottom: '2px',
                width: '1px',
                background: '#22c55e',
                borderRadius: '0 1px 1px 0',
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#22c55e' }}>98%</span>
        </div>
        <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Nova</h1>
        <div className="header-actions">
          <button type="button" className="btn ghost" onClick={() => setPrivacyOpen(true)}>
            Privacy
          </button>
        </div>
      </header>

      <main className="main-area">
        {activeTab === 'home' && (
          <HomeTab
            statusLine="Nova handled 41 actions today and flagged 3 follow-ups for review."
            quickControls={quickControls}
            items={proactiveItems}
            timers={timers}
            onDismiss={dismissProactiveItem}
          />
        )}

        {activeTab === 'memories' && (
          <MemoriesTab memories={memories} onTogglePin={togglePinMemory} onForget={forgetMemory} />
        )}

        {activeTab === 'timers' && (
          <TimersTab
            timers={timers}
            reminders={reminders}
            setTimers={setTimers}
            setReminders={setReminders}
            onRequestUndo={requestUndo}
          />
        )}

        {activeTab === 'lists' && (
          <ListsTab
            listGroups={listGroups}
            setListGroups={setListGroups}
            onRequestUndo={requestUndo}
          />
        )}

        {activeTab === 'automations' && <AutomationsTab automations={automations} />}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <BottomSheet open={privacyOpen} title="Privacy controls" onClose={() => setPrivacyOpen(false)}>
        <div className="field-grid">
          <label className="switch-row" htmlFor="privacy-on-device">
            <span>Keep wellness inference on device</span>
            <input
              id="privacy-on-device"
              type="checkbox"
              checked={privacyOnDevice}
              onChange={(event) => setPrivacyOnDevice(event.target.checked)}
            />
          </label>
          <label className="switch-row" htmlFor="privacy-retention">
            <span>Retain detailed memory logs for 30 days</span>
            <input
              id="privacy-retention"
              type="checkbox"
              checked={privacyRetention}
              onChange={(event) => setPrivacyRetention(event.target.checked)}
            />
          </label>
        </div>
      </BottomSheet>

      {undoState && (
        <UndoToast
          label={undoState.label}
          onUndo={() => {
            undoState.undo()
            setUndoState(null)
          }}
          onClose={() => setUndoState(null)}
        />
      )}
    </div>
  )
}

export default App
