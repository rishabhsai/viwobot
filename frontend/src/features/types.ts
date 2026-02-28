export type TabKey = 'home' | 'timers' | 'lists' | 'automations' | 'memories'

export type ProactivePriority = 'Low' | 'Medium' | 'High'

export type ProactiveItem = {
  id: string
  title: string
  reason: string
  priority: ProactivePriority
  confidence: number
  actions: {
    primary: string
    secondary: string
  }
}

export type MemoryCategory = 'People' | 'Places' | 'Routines' | 'Preferences'

export type MemoryItem = {
  id: string
  text: string
  category: MemoryCategory
  source: string
  updatedAt: string
  pinned: boolean
}

export type TimerStatus = 'running' | 'paused'

export type TimerItem = {
  id: string
  label: string
  remainingSeconds: number
  status: TimerStatus
}

export type ReminderItem = {
  id: string
  label: string
  schedule: string
  recurrence: string
  enabled: boolean
}

export type ListItem = {
  id: string
  text: string
  done: boolean
  position: number
}

export type ListGroup = {
  id: string
  name: string
  type: 'todos' | 'custom'
  items: ListItem[]
}

export type InboxKind = 'approval' | 'exception' | 'external'

export type InboxStatus = 'new' | 'pending' | 'done'

export type InboxItem = {
  id: string
  kind: InboxKind
  source: string
  title: string
  detail: string
  dueAt?: string
  priority: ProactivePriority
  status: InboxStatus
}

export type AutomationStep = {
  id: string
  action: string
  target: string
}

export type AutomationItem = {
  id: string
  title: string
  trigger: string
  description: string
  steps: AutomationStep[]
}

export type ConnectedSource = {
  id: string
  label: string
  connected: boolean
  authState: 'connected' | 'disconnected' | 'expired'
}

export type UndoRequest = {
  label: string
  undo: () => void
}
