import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import BottomSheet from '../primitives/BottomSheet'
import EmptyState from '../primitives/EmptyState'
import Panel from '../primitives/Panel'
import type { ReminderItem, TimerItem, UndoRequest } from '../types'

type TimersTabProps = {
  timers: TimerItem[]
  reminders: ReminderItem[]
  setTimers: Dispatch<SetStateAction<TimerItem[]>>
  setReminders: Dispatch<SetStateAction<ReminderItem[]>>
  onRequestUndo: (request: UndoRequest) => void
}

type EditTarget =
  | { kind: 'timer'; id: string }
  | { kind: 'reminder'; id: string }
  | null

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function TimersTab({
  timers,
  reminders,
  setTimers,
  setReminders,
  onRequestUndo,
}: TimersTabProps) {
  const [editTarget, setEditTarget] = useState<EditTarget>(null)
  const [labelField, setLabelField] = useState('')
  const [timeField, setTimeField] = useState('10')
  const [recurrenceField, setRecurrenceField] = useState('Daily')

  const editRecord = useMemo(() => {
    if (!editTarget) {
      return null
    }

    if (editTarget.kind === 'timer') {
      return timers.find((timer) => timer.id === editTarget.id) ?? null
    }

    return reminders.find((reminder) => reminder.id === editTarget.id) ?? null
  }, [editTarget, reminders, timers])

  const openTimerEditor = (timer: TimerItem) => {
    setEditTarget({ kind: 'timer', id: timer.id })
    setLabelField(timer.label)
    setTimeField(String(Math.max(1, Math.ceil(timer.remainingSeconds / 60))))
    setRecurrenceField('Daily')
  }

  const openReminderEditor = (reminder: ReminderItem) => {
    setEditTarget({ kind: 'reminder', id: reminder.id })
    setLabelField(reminder.label)
    setTimeField(reminder.schedule)
    setRecurrenceField(reminder.recurrence)
  }

  return (
    <section className="tab-content">
      <Panel title="Active timers" subtitle="Pause, extend, edit, or remove timers">
        {timers.length === 0 ? (
          <EmptyState
            title="No active timers"
            description="Create a timer so Nova can track active countdowns here."
            actionLabel="Add timer"
            onAction={() => {
              const newTimer: TimerItem = {
                id: `tim-${Date.now()}`,
                label: 'New timer',
                remainingSeconds: 600,
                status: 'running',
              }
              setTimers((previous) => [...previous, newTimer])
            }}
          />
        ) : (
          <div className="stack">
            {timers.map((timer) => (
              <article className="card-row" key={timer.id}>
                <div className="card-title-line">
                  <h3>{timer.label}</h3>
                  <span className="badge">{timer.status === 'running' ? 'Running' : 'Paused'}</span>
                </div>
                <p className="timer-value">{formatDuration(timer.remainingSeconds)}</p>
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setTimers((previous) =>
                        previous.map((entry) =>
                          entry.id === timer.id
                            ? {
                                ...entry,
                                status: entry.status === 'running' ? 'paused' : 'running',
                              }
                            : entry,
                        ),
                      )
                    }}
                  >
                    {timer.status === 'running' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setTimers((previous) =>
                        previous.map((entry) =>
                          entry.id === timer.id
                            ? { ...entry, remainingSeconds: entry.remainingSeconds + 60 }
                            : entry,
                        ),
                      )
                    }}
                  >
                    +1 min
                  </button>
                  <button type="button" className="btn ghost" onClick={() => openTimerEditor(timer)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setTimers((previous) => previous.filter((entry) => entry.id !== timer.id))
                      onRequestUndo({
                        label: 'Timer deleted',
                        undo: () => {
                          setTimers((previous) => [...previous, timer])
                        },
                      })
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Reminders" subtitle="Edit schedules and recurrence">
        {reminders.length === 0 ? (
          <EmptyState
            title="No reminders"
            description="Add reminders to keep personal and home tasks on track."
            actionLabel="Add reminder"
            onAction={() => {
              const newReminder: ReminderItem = {
                id: `rem-${Date.now()}`,
                label: 'New reminder',
                schedule: 'Tonight, 9:00 PM',
                recurrence: 'Daily',
                enabled: true,
              }
              setReminders((previous) => [...previous, newReminder])
            }}
          />
        ) : (
          <div className="stack">
            {reminders.map((reminder) => (
              <article className="card-row" key={reminder.id}>
                <div className="card-title-line">
                  <h3>{reminder.label}</h3>
                  <span className="badge">{reminder.recurrence}</span>
                </div>
                <p className="muted">{reminder.schedule}</p>
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => openReminderEditor(reminder)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setReminders((previous) =>
                        previous.map((entry) =>
                          entry.id === reminder.id
                            ? {
                                ...entry,
                                schedule: `${entry.schedule} + 30 min`,
                              }
                            : entry,
                        ),
                      )
                    }}
                  >
                    Snooze
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setReminders((previous) => previous.filter((entry) => entry.id !== reminder.id))
                      onRequestUndo({
                        label: 'Reminder marked done',
                        undo: () => {
                          setReminders((previous) => [...previous, reminder])
                        },
                      })
                    }}
                  >
                    Mark done
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <BottomSheet
        open={Boolean(editTarget)}
        title={editTarget?.kind === 'timer' ? 'Edit timer' : 'Edit reminder'}
        onClose={() => setEditTarget(null)}
      >
        <div className="field-grid">
          <label className="field" htmlFor="edit-label">
            Label
            <input
              id="edit-label"
              type="text"
              value={labelField}
              onChange={(event) => setLabelField(event.target.value)}
            />
          </label>

          {editTarget?.kind === 'timer' ? (
            <label className="field" htmlFor="edit-minutes">
              Minutes remaining
              <input
                id="edit-minutes"
                type="number"
                min={1}
                value={timeField}
                onChange={(event) => setTimeField(event.target.value)}
              />
            </label>
          ) : (
            <>
              <label className="field" htmlFor="edit-schedule">
                Schedule
                <input
                  id="edit-schedule"
                  type="text"
                  value={timeField}
                  onChange={(event) => setTimeField(event.target.value)}
                />
              </label>
              <label className="field" htmlFor="edit-recurrence">
                Recurrence
                <input
                  id="edit-recurrence"
                  type="text"
                  value={recurrenceField}
                  onChange={(event) => setRecurrenceField(event.target.value)}
                />
              </label>
            </>
          )}
        </div>

        <div className="sheet-actions">
          <button
            type="button"
            className="btn solid"
            onClick={() => {
              if (!editTarget || !editRecord) {
                return
              }

              if (editTarget.kind === 'timer') {
                setTimers((previous) =>
                  previous.map((entry) =>
                    entry.id === editTarget.id
                      ? {
                          ...entry,
                          label: labelField.trim() || entry.label,
                          remainingSeconds: Math.max(60, Number(timeField || '1') * 60),
                        }
                      : entry,
                  ),
                )
              } else {
                setReminders((previous) =>
                  previous.map((entry) =>
                    entry.id === editTarget.id
                      ? {
                          ...entry,
                          label: labelField.trim() || entry.label,
                          schedule: timeField.trim() || entry.schedule,
                          recurrence: recurrenceField.trim() || entry.recurrence,
                        }
                      : entry,
                  ),
                )
              }

              setEditTarget(null)
            }}
          >
            Save changes
          </button>
          <button type="button" className="btn ghost" onClick={() => setEditTarget(null)}>
            Cancel
          </button>
        </div>
      </BottomSheet>
    </section>
  )
}
