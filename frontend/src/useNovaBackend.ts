/**
 * useNovaBackend.ts
 * ------------------
 * Single hook that wires up the Nova frontend to the FastAPI backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws/status'
const POLL_MS = 10_000

export interface Reminder {
    id: string
    message: string
    fire_at: string
    created_at: string
}

export type NovaState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'reminder' | 'tutor_question' | 'tutor_feedback'

export interface NovaStatus {
    state: NovaState
    transcript?: string
    response?: string
    question?: string
    topic?: string
    correct?: boolean
    explanation?: string
    message?: string
}

export function useNovaBackend() {
    const [status, setStatus] = useState<NovaStatus>({ state: 'idle' })
    const [reminders, setReminders] = useState<Reminder[]>([])
    const [connected, setConnected] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const fetchReminders = useCallback(async () => {
        try {
            const res = await fetch(`${API}/reminders`)
            if (res.ok) setReminders(await res.json())
        } catch { /* backend offline */ }
    }, [])

    const deleteReminder = useCallback(async (id: string) => {
        try {
            await fetch(`${API}/reminders/${id}`, { method: 'DELETE' })
            setReminders(prev => prev.filter(r => r.id !== id))
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        let reconnectTimeout: ReturnType<typeof setTimeout>

        function connect() {
            const ws = new WebSocket(WS_URL)
            wsRef.current = ws

            ws.onopen = () => setConnected(true)
            ws.onmessage = (event) => {
                try {
                    const payload: NovaStatus = JSON.parse(event.data)
                    setStatus(payload)
                    if (payload.state === 'idle' || payload.state === 'reminder') {
                        fetchReminders()
                    }
                } catch { /* malformed JSON */ }
            }
            ws.onclose = () => {
                setConnected(false)
                reconnectTimeout = setTimeout(connect, 3000)
            }
            ws.onerror = () => ws.close()
        }

        connect()
        pollRef.current = setInterval(fetchReminders, POLL_MS)
        fetchReminders()

        return () => {
            clearTimeout(reconnectTimeout)
            if (pollRef.current) clearInterval(pollRef.current)
            wsRef.current?.close()
        }
    }, [fetchReminders])

    return { status, connected, reminders, deleteReminder, refetchReminders: fetchReminders }
}
