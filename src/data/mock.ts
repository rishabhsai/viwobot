// ════════════════════════════════════════════════════
// OpenClaw Mock Data
// ════════════════════════════════════════════════════

export interface Timer {
    id: string;
    label: string;
    duration: number; // total seconds
    remaining: number; // seconds remaining
    isRunning: boolean;
    room?: string;
}

export interface Reminder {
    id: string;
    text: string;
    time: string;
    recurring: 'daily' | 'weekdays' | 'weekends' | 'once' | 'location';
    location?: string;
    missed?: boolean;
}

export interface ActivityItem {
    id: string;
    action: string;
    source: 'voice' | 'automation' | 'manual' | 'schedule';
    devices: string[];
    room: string;
    time: string;
    result: 'success' | 'failure';
    explanation?: string;
    reversible?: boolean;
}

export interface Automation {
    id: string;
    name: string;
    trigger: string;
    conditions: string[];
    actions: string[];
    enabled: boolean;
    lastRun?: string;
    runCount: number;
    category: 'morning' | 'evening' | 'away' | 'custom' | 'sick' | 'bedtime';
}

export interface HealthMetric {
    time: string;
    heartRate: number;
    hrv: number;
    sleep: number;
    steps: number;
    calories: number;
}

export interface HouseholdMember {
    id: string;
    name: string;
    avatar: string;
    role: 'admin' | 'adult' | 'kid' | 'guest';
    routines: number;
    isHome: boolean;
}

export interface ProactiveSuggestion {
    id: string;
    message: string;
    reason: string;
    actions: { label: string; primary?: boolean }[];
    confidence: 'high' | 'medium' | 'low';
    category: 'health' | 'schedule' | 'home' | 'energy' | 'security';
    icon: string;
}

export interface DeviceStatus {
    id: string;
    name: string;
    room: string;
    type: 'light' | 'thermostat' | 'lock' | 'speaker' | 'camera' | 'plug' | 'blind';
    status: 'on' | 'off' | 'locked' | 'unlocked';
    value?: string;
}

// ── Mock Timers ──
export const timers: Timer[] = [
    { id: 't1', label: 'Pasta boiling', duration: 720, remaining: 342, isRunning: true, room: 'Kitchen' },
    { id: 't2', label: 'Laundry cycle', duration: 3600, remaining: 1847, isRunning: true, room: 'Utility' },
    { id: 't3', label: 'Focus session', duration: 1500, remaining: 0, isRunning: false, room: 'Office' },
];

// ── Mock Reminders ──
export const reminders: Reminder[] = [
    { id: 'r1', text: 'Take vitamins', time: '8:00 AM', recurring: 'daily' },
    { id: 'r2', text: 'Water the plants', time: '10:00 AM', recurring: 'weekdays' },
    { id: 'r3', text: 'Call Mom', time: '6:00 PM', recurring: 'weekends' },
    { id: 'r4', text: 'Dentist appointment', time: '2:30 PM', recurring: 'once', missed: true },
    { id: 'r5', text: 'Pick up dry cleaning', time: '', recurring: 'location', location: 'Near Main St' },
];

// ── Mock Activity ──
export const activityLog: ActivityItem[] = [
    { id: 'a1', action: 'Turned on living room lights', source: 'voice', devices: ['Hue Bulbs x4'], room: 'Living Room', time: '5:32 PM', result: 'success', reversible: true },
    { id: 'a2', action: 'Set thermostat to 72°F', source: 'automation', devices: ['Nest Thermostat'], room: 'Hallway', time: '5:15 PM', result: 'success', explanation: 'Triggered by "Evening comfort" automation: When sunset + someone home → set to 72°F', reversible: true },
    { id: 'a3', action: 'Started coffee machine', source: 'schedule', devices: ['Smart Plug #2'], room: 'Kitchen', time: '4:45 PM', result: 'success', explanation: 'Daily schedule: Brew coffee at 4:45 PM on weekdays', reversible: true },
    { id: 'a4', action: 'Locked front door', source: 'automation', devices: ['August Lock'], room: 'Entryway', time: '4:30 PM', result: 'success', explanation: 'Auto-lock after 30 min of no motion detected at entryway', reversible: true },
    { id: 'a5', action: 'Failed to play music on bedroom speaker', source: 'voice', devices: ['HomePod Mini'], room: 'Bedroom', time: '3:12 PM', result: 'failure', explanation: 'Device was offline — last seen 2 hours ago' },
    { id: 'a6', action: 'Closed garage door', source: 'manual', devices: ['MyQ Garage'], room: 'Garage', time: '2:50 PM', result: 'success', reversible: true },
    { id: 'a7', action: 'Adjusted blinds to 40%', source: 'automation', devices: ['Lutron Blinds'], room: 'Office', time: '1:20 PM', result: 'success', explanation: 'Sun angle automation: reduce glare when sun position > 45° on south-facing windows', reversible: true },
    { id: 'a8', action: 'Turned off all lights', source: 'voice', devices: ['All Lights'], room: 'Whole Home', time: '11:30 PM', result: 'success', reversible: true },
];

// ── Mock Automations ──
export const automations: Automation[] = [
    { id: 'au1', name: 'Morning Wake Up', trigger: 'Weekdays at 6:45 AM', conditions: ['Someone is home'], actions: ['Gradually raise bedroom lights to 60%', 'Start coffee machine', 'Play morning news briefing'], enabled: true, lastRun: 'Today, 6:45 AM', runCount: 142, category: 'morning' },
    { id: 'au2', name: 'Evening Comfort', trigger: 'Sunset', conditions: ['Someone is home', 'Temperature below 70°F'], actions: ['Set thermostat to 72°F', 'Turn on living room accent lights', 'Close blinds'], enabled: true, lastRun: 'Today, 5:15 PM', runCount: 89, category: 'evening' },
    { id: 'au3', name: 'Away Mode', trigger: 'Everyone leaves home', conditions: ['All phones leave geofence'], actions: ['Lock all doors', 'Set thermostat to 65°F', 'Turn off all lights', 'Enable cameras'], enabled: true, lastRun: 'Yesterday, 8:30 AM', runCount: 67, category: 'away' },
    { id: 'au4', name: 'Bedtime Routine', trigger: '"Goodnight" voice command', conditions: [], actions: ['Turn off all lights except hallway nightlight', 'Lock all doors', 'Set thermostat to 68°F', 'Enable do not disturb'], enabled: true, lastRun: 'Yesterday, 11:15 PM', runCount: 203, category: 'bedtime' },
    { id: 'au5', name: 'Sick Day Mode', trigger: 'Manual activation', conditions: [], actions: ['Cancel morning alarm', 'Set thermostat to 74°F', 'Dim all lights to 30%', 'Reschedule meetings (with approval)'], enabled: false, runCount: 3, category: 'sick' },
    { id: 'au6', name: 'Rainy Day Cozy', trigger: 'Weather: Rain detected', conditions: ['After 4 PM', 'Someone is home'], actions: ['Close all blinds', 'Set warm lighting scene', 'Start fireplace ambiance on speakers'], enabled: true, lastRun: 'Last week', runCount: 12, category: 'custom' },
];

// ── Mock Health Metrics (7 days) ──
export const healthMetrics: HealthMetric[] = [
    { time: 'Mon', heartRate: 62, hrv: 48, sleep: 7.2, steps: 8400, calories: 2100 },
    { time: 'Tue', heartRate: 65, hrv: 42, sleep: 6.1, steps: 6200, calories: 1950 },
    { time: 'Wed', heartRate: 68, hrv: 38, sleep: 5.8, steps: 4800, calories: 1800 },
    { time: 'Thu', heartRate: 71, hrv: 35, sleep: 6.5, steps: 7100, calories: 2050 },
    { time: 'Fri', heartRate: 64, hrv: 45, sleep: 7.8, steps: 9200, calories: 2300 },
    { time: 'Sat', heartRate: 60, hrv: 50, sleep: 8.4, steps: 11000, calories: 2500 },
    { time: 'Sun', heartRate: 61, hrv: 52, sleep: 8.1, steps: 7500, calories: 2200 },
];

// ── Mock Household ──
export const householdMembers: HouseholdMember[] = [
    { id: 'h1', name: 'You', avatar: '👤', role: 'admin', routines: 6, isHome: true },
    { id: 'h2', name: 'Sarah', avatar: '👩', role: 'adult', routines: 4, isHome: true },
    { id: 'h3', name: 'Max', avatar: '👦', role: 'kid', routines: 2, isHome: false },
    { id: 'h4', name: 'Guest WiFi', avatar: '📶', role: 'guest', routines: 0, isHome: false },
];

// ── Mock Proactive Suggestions ──
export const proactiveSuggestions: ProactiveSuggestion[] = [
    { id: 'p1', message: 'Your resting heart rate is 12% above your baseline. Combined with reduced sleep, you might be getting sick.', reason: 'Based on 3-day HR/HRV/sleep trend from Apple Watch', actions: [{ label: 'Activate Sick Day Mode', primary: true }, { label: 'Dismiss' }], confidence: 'medium', category: 'health', icon: '❤️‍🩹' },
    { id: 'p2', message: 'You have a meeting at 9 AM but usually leave at 8:40. Traffic is heavier today — leave by 8:25.', reason: 'Calendar + Maps + historical commute data', actions: [{ label: 'Set departure alarm', primary: true }, { label: 'Ignore' }], confidence: 'high', category: 'schedule', icon: '🚗' },
    { id: 'p3', message: 'Your living room lights have been on for 6 hours with no motion detected. Turn them off?', reason: 'Motion sensor inactive since 11:30 AM', actions: [{ label: 'Turn off', primary: true }, { label: 'Keep on' }], confidence: 'high', category: 'energy', icon: '💡' },
    { id: 'p4', message: 'Front door has been unlocked for 45 minutes. Everyone is home — lock it?', reason: 'Door sensor + presence detection', actions: [{ label: 'Lock now', primary: true }, { label: 'Remind in 30 min' }], confidence: 'high', category: 'security', icon: '🔐' },
];

// ── Mock Device Status ──
export const devices: DeviceStatus[] = [
    { id: 'd1', name: 'Ceiling Lights', room: 'Living Room', type: 'light', status: 'on', value: '80%' },
    { id: 'd2', name: 'Accent Strip', room: 'Living Room', type: 'light', status: 'on', value: 'Warm' },
    { id: 'd3', name: 'Thermostat', room: 'Hallway', type: 'thermostat', status: 'on', value: '72°F' },
    { id: 'd4', name: 'Front Door', room: 'Entryway', type: 'lock', status: 'locked' },
    { id: 'd5', name: 'Garage Door', room: 'Garage', type: 'lock', status: 'locked' },
    { id: 'd6', name: 'HomePod', room: 'Living Room', type: 'speaker', status: 'on', value: 'Jazz FM' },
    { id: 'd7', name: 'Office Camera', room: 'Office', type: 'camera', status: 'off' },
    { id: 'd8', name: 'Coffee Machine', room: 'Kitchen', type: 'plug', status: 'off' },
    { id: 'd9', name: 'Window Blinds', room: 'Office', type: 'blind', status: 'on', value: '40%' },
    { id: 'd10', name: 'Bedroom Lights', room: 'Bedroom', type: 'light', status: 'off' },
];

// ── Summary Data ──
export const summaryData = {
    morning: {
        weather: '64°F, Partly Cloudy',
        schedule: ['Team standup at 9:30 AM', 'Lunch with Alex at 12:00 PM', 'Dentist at 2:30 PM'],
        homeStatus: 'All secure. Thermostat at 72°F. 3 lights on.',
        unfinished: ['Water the plants', 'Reply to maintenance email'],
    },
    evening: {
        completed: 14,
        missed: 1,
        anomalies: ['Bedroom speaker went offline at 3:12 PM', 'Energy usage 8% above average today'],
    },
    weekly: {
        alarmsHit: 4,
        alarmsSnoozed: 7,
        automationsRun: 38,
        energyChange: '+11%',
        avgSleep: '6.8 hrs',
        mostUsedRoom: 'Living Room',
    },
};

// ── Conversation Thread (Voice) ──
export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    time: string;
    devices?: string[];
}

export const conversationHistory: ConversationMessage[] = [
    { id: 'c1', role: 'user', text: 'Hey OpenClaw, what\'s the temperature?', time: '5:30 PM' },
    { id: 'c2', role: 'assistant', text: 'It\'s 72°F inside and 64°F outside. The thermostat is set to comfort mode.', time: '5:30 PM', devices: ['Nest Thermostat'] },
    { id: 'c3', role: 'user', text: 'Set it to 70', time: '5:31 PM' },
    { id: 'c4', role: 'assistant', text: 'Done! Thermostat adjusted to 70°F. It should reach that in about 15 minutes.', time: '5:31 PM', devices: ['Nest Thermostat'] },
    { id: 'c5', role: 'user', text: 'Turn on the living room lights and play some jazz', time: '5:32 PM' },
    { id: 'c6', role: 'assistant', text: 'Living room lights are on at 80%. Playing Jazz FM on the HomePod. 🎵', time: '5:32 PM', devices: ['Hue Bulbs x4', 'HomePod'] },
    { id: 'c7', role: 'user', text: 'Set a timer for pasta, 12 minutes', time: '5:33 PM' },
    { id: 'c8', role: 'assistant', text: 'Pasta timer set for 12 minutes. I\'ll announce when it\'s done on the kitchen speaker. ⏱️', time: '5:33 PM' },
];
