import type {
  AutomationItem,
  ConnectedSource,
  InboxItem,
  ListGroup,
  MemoryItem,
  ProactiveItem,
  ReminderItem,
  TimerItem,
} from '../types'

export const initialProactiveItems: ProactiveItem[] = [
  {
    id: 'pro-1',
    title: 'Delay morning meetings by 90 minutes',
    reason: 'Sleep and recovery trend has been lower for two nights.',
    priority: 'High',
    confidence: 82,
    actions: {
      primary: 'Review schedule changes',
      secondary: 'Dismiss',
    },
  },
  {
    id: 'pro-2',
    title: 'Run quiet home mode at 9:30 PM',
    reason: 'You are usually asleep by 10:10 PM on weekdays.',
    priority: 'Medium',
    confidence: 76,
    actions: {
      primary: 'Enable for tonight',
      secondary: 'Skip tonight',
    },
  },
  {
    id: 'pro-3',
    title: 'Create reply reminder for LinkedIn message',
    reason: 'Message is still unread after 18 hours.',
    priority: 'Low',
    confidence: 67,
    actions: {
      primary: 'Add to Todos',
      secondary: 'Dismiss',
    },
  },
]

export const quickControls = [
  'Set 10 minute timer',
  'Run Evening reset',
  'Lock all doors',
  'Start Quiet mode',
]

export const initialMemories: MemoryItem[] = [
  {
    id: 'mem-1',
    text: 'Riya prefers warm lights after 8 PM in the living room.',
    category: 'Preferences',
    source: 'Observed from routine edits',
    updatedAt: 'Updated 2 hours ago',
    pinned: true,
  },
  {
    id: 'mem-2',
    text: 'Office is usually occupied from 9:00 AM to 6:00 PM on weekdays.',
    category: 'Routines',
    source: 'Calendar + occupancy pattern',
    updatedAt: 'Updated yesterday',
    pinned: false,
  },
  {
    id: 'mem-3',
    text: 'Grandma visits on Saturdays around 4 PM.',
    category: 'People',
    source: 'Guest access history',
    updatedAt: 'Updated 3 days ago',
    pinned: false,
  },
  {
    id: 'mem-4',
    text: 'Front entry deliveries are usually left near the left bench.',
    category: 'Places',
    source: 'Camera and pickup confirmations',
    updatedAt: 'Updated 6 days ago',
    pinned: false,
  },
]

export const initialTimers: TimerItem[] = [
  {
    id: 'tim-1',
    label: 'Pasta timer',
    remainingSeconds: 193,
    status: 'running',
  },
  {
    id: 'tim-2',
    label: 'Laundry cycle',
    remainingSeconds: 1440,
    status: 'paused',
  },
]

export const initialReminders: ReminderItem[] = [
  {
    id: 'rem-1',
    label: 'Take vitamins',
    schedule: 'Today, 8:00 PM',
    recurrence: 'Daily',
    enabled: true,
  },
  {
    id: 'rem-2',
    label: 'Check Canvas assignments',
    schedule: 'Today, 7:15 PM',
    recurrence: 'Weekdays',
    enabled: true,
  },
]

export const initialListGroups: ListGroup[] = [
  {
    id: 'list-todos',
    name: 'Todos',
    type: 'todos',
    items: [
      { id: 'todo-1', text: 'Reply to LinkedIn message from Maya', done: false, position: 1 },
      { id: 'todo-2', text: 'Review tomorrow morning schedule', done: false, position: 2 },
    ],
  },
  {
    id: 'list-shopping',
    name: 'Shopping',
    type: 'custom',
    items: [
      { id: 'shop-1', text: 'Coffee beans', done: false, position: 1 },
      { id: 'shop-2', text: 'Laundry detergent', done: false, position: 2 },
    ],
  },
  {
    id: 'list-ideas',
    name: 'Ideas',
    type: 'custom',
    items: [{ id: 'idea-1', text: 'Automate post-gym cool-down mode', done: false, position: 1 }],
  },
]

export const initialAutomations: AutomationItem[] = [
  {
    id: 'auto-1',
    title: 'Morning Briefing',
    trigger: 'When alarm dismissed',
    description: 'Reads schedule, weather, and opens blinds.',
    steps: [
      { id: 's1', action: 'Read Schedule', target: 'Calendar' },
      { id: 's2', action: 'Read Weather', target: 'Weather API' },
      { id: 's3', action: 'Open Blinds', target: 'Living Room' },
    ],
  },
  {
    id: 'auto-2',
    title: 'Evening Wind Down',
    trigger: 'At 10:00 PM',
    description: 'Dims lights, locks doors, and turns on white noise.',
    steps: [
      { id: 's4', action: 'Dim Lights to 20%', target: 'All Rooms' },
      { id: 's5', action: 'Lock', target: 'Front & Back Door' },
      { id: 's6', action: 'Play White noise', target: 'Bedroom Speaker' },
    ],
  },
]

export const initialInboxItems: InboxItem[] = [
  {
    id: 'inb-1',
    kind: 'approval',
    source: 'Nova',
    title: 'Move Monday 8:30 AM standup to 10:00 AM',
    detail: 'Recovery trend is low. This follows your previous sick-week pattern.',
    dueAt: 'Due tonight',
    priority: 'High',
    status: 'pending',
  },
  {
    id: 'inb-2',
    kind: 'exception',
    source: 'Home lock',
    title: 'Front door remained unlocked for 14 minutes',
    detail: 'Nova relocked automatically, but wants confirmation to keep auto-relock active.',
    priority: 'Medium',
    status: 'new',
  },
  {
    id: 'inb-3',
    kind: 'external',
    source: 'Email',
    title: 'Reply to professor email about project milestone',
    detail: 'Email marked urgent and awaiting your response.',
    dueAt: 'Tomorrow, 9:00 AM',
    priority: 'High',
    status: 'new',
  },
  {
    id: 'inb-4',
    kind: 'external',
    source: 'Canvas',
    title: 'Submit assignment reflection draft',
    detail: 'Canvas due date is tonight at 11:59 PM.',
    dueAt: 'Tonight, 11:59 PM',
    priority: 'High',
    status: 'new',
  },
  {
    id: 'inb-5',
    kind: 'external',
    source: 'LinkedIn',
    title: 'Respond to collaboration message from Priya',
    detail: 'Message received this morning and still unread.',
    priority: 'Low',
    status: 'new',
  },
]

export const initialConnectedSources: ConnectedSource[] = [
  { id: 'src-email', label: 'Email', connected: false, authState: 'disconnected' },
  { id: 'src-calendar', label: 'Calendar', connected: false, authState: 'disconnected' },
  { id: 'src-linkedin', label: 'LinkedIn', connected: false, authState: 'disconnected' },
  { id: 'src-canvas', label: 'Canvas', connected: false, authState: 'disconnected' },
]
