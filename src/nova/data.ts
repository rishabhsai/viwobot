export type TabKey = 'home' | 'lists' | 'timers' | 'inbox' | 'memories'

export interface ProactiveItem {
    id: string
    title: string
    reason: string
    priority: 'low' | 'medium' | 'high'
    confidence: number
}

export const proactiveItems: ProactiveItem[] = [
    {
        id: 'p1',
        title: 'Elevated resting heart rate detected',
        reason: 'Your resting HR is 12% above your 30-day average. Combined with low sleep scores, you may be getting sick.',
        priority: 'high',
        confidence: 85,
    },
    {
        id: 'p2',
        title: 'Move 8:30 AM meeting to 10:00 AM',
        reason: 'Your recovery score is low today. 10:00 AM is open on your calendar.',
        priority: 'medium',
        confidence: 90,
    }
]

export interface MemoryItem {
    id: string
    text: string
    category: string
    pinned: boolean
}

export const memories: MemoryItem[] = [
    { id: 'm1', text: 'Prefers bedroom at 68°F for sleeping.', category: 'Preferences', pinned: true },
    { id: 'm2', text: 'Allergic to cats.', category: 'Preferences', pinned: true },
    { id: 'm3', text: 'Weekly team standup is Mondays and Thursdays at 9:30 AM.', category: 'Routines', pinned: false },
]

export interface InboxItem {
    id: string
    title: string
    detail: string
    source: string
}

export const inboxItems: InboxItem[] = [
    { id: 'i1', title: 'Reschedule morning standup', detail: 'Nova detected low recovery and suggests moving your 9:30 meeting.', source: 'Automation' },
    { id: 'i2', title: 'Sign lease renewal', detail: 'Landlord sent renewal via email. Due by end of week.', source: 'Email' },
]

export const listsData = [
    { id: 'li1', text: 'Reply to maintenance email', done: false },
    { id: 'li2', text: 'Pick up dry cleaning', done: false },
]
