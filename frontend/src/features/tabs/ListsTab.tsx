import { useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import Panel from '../primitives/Panel'
import type { ListGroup, ListItem, UndoRequest } from '../types'

type ListsTabProps = {
  listGroups: ListGroup[]
  setListGroups: Dispatch<SetStateAction<ListGroup[]>>
  onRequestUndo: (request: UndoRequest) => void
}

function normalizePositions(items: ListItem[]): ListItem[] {
  return items.map((item, index) => ({
    ...item,
    position: index + 1,
  }))
}

export default function ListsTab({ listGroups, setListGroups, onRequestUndo }: ListsTabProps) {
  const [fastCapture, setFastCapture] = useState('')
  const [openListId, setOpenListId] = useState('list-todos')
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)

  const todosGroup = useMemo(
    () => listGroups.find((group) => group.type === 'todos') ?? null,
    [listGroups],
  )

  const customGroups = listGroups.filter((group) => group.type !== 'todos')

  const addItemToGroup = (groupId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) {
      return
    }

    setListGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group
        }

        const nextItems = [
          ...group.items,
          {
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            text: trimmed,
            done: false,
            position: group.items.length + 1,
          },
        ]

        return {
          ...group,
          items: normalizePositions(nextItems),
        }
      }),
    )
  }

  const toggleItem = (groupId: string, itemId: string) => {
    setListGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group
        }

        return {
          ...group,
          items: group.items.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item,
          ),
        }
      }),
    )
  }

  const deleteItem = (groupId: string, item: ListItem) => {
    setListGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group
        }

        return {
          ...group,
          items: normalizePositions(group.items.filter((entry) => entry.id !== item.id)),
        }
      }),
    )

    onRequestUndo({
      label: 'List item deleted',
      undo: () => {
        setListGroups((previous) =>
          previous.map((group) => {
            if (group.id !== groupId) {
              return group
            }

            return {
              ...group,
              items: normalizePositions([...group.items, item]),
            }
          }),
        )
      },
    })
  }

  const moveItem = (groupId: string, targetId: string) => {
    if (!draggingItemId || draggingItemId === targetId) {
      return
    }

    setListGroups((previous) =>
      previous.map((group) => {
        if (group.id !== groupId) {
          return group
        }

        const sourceIndex = group.items.findIndex((item) => item.id === draggingItemId)
        const targetIndex = group.items.findIndex((item) => item.id === targetId)

        if (sourceIndex < 0 || targetIndex < 0) {
          return group
        }

        const next = [...group.items]
        const [moved] = next.splice(sourceIndex, 1)
        next.splice(targetIndex, 0, moved)

        return {
          ...group,
          items: normalizePositions(next),
        }
      }),
    )

    setDraggingItemId(null)
  }

  const pendingCount = (items: ListItem[]) => items.filter((item) => !item.done).length

  return (
    <section className="tab-content">
      <Panel title="Lists" subtitle="Todos first, then your other lists">
        <form
          className="capture-row"
          onSubmit={(event) => {
            event.preventDefault()
            addItemToGroup('list-todos', fastCapture)
            setFastCapture('')
          }}
        >
          <label className="field capture-field" htmlFor="fast-capture">
            Fast capture
            <input
              id="fast-capture"
              type="text"
              value={fastCapture}
              placeholder="Add a task quickly"
              onChange={(event) => setFastCapture(event.target.value)}
            />
          </label>
          <button type="submit" className="btn solid capture-submit">
            Add
          </button>
        </form>
      </Panel>

      {todosGroup && (
        <Panel
          title="Todos"
          subtitle={`${pendingCount(todosGroup.items)} pending`}
          action={
            <button type="button" className="btn ghost" onClick={() => setOpenListId(todosGroup.id)}>
              Open
            </button>
          }
        >
          {openListId === todosGroup.id && (
            <ul className="list-items" aria-label="Todos">
              {todosGroup.items.map((item) => (
                <li
                  key={item.id}
                  className="item-row"
                  draggable
                  onDragStart={() => setDraggingItemId(item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => moveItem(todosGroup.id, item.id)}
                >
                  <button
                    type="button"
                    className={item.done ? 'check done' : 'check'}
                    onClick={() => toggleItem(todosGroup.id, item.id)}
                    aria-label={item.done ? 'Mark todo as not done' : 'Mark todo as done'}
                  >
                    {item.done ? 'Done' : 'Todo'}
                  </button>
                  <p className={item.done ? 'item-text done' : 'item-text'}>{item.text}</p>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => deleteItem(todosGroup.id, item)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <Panel title="Other lists">
        <div className="stack">
          {customGroups.map((group) => (
            <article key={group.id} className="card-row">
              <div
                className="card-title-line"
                style={{ cursor: 'pointer', paddingBottom: openListId === group.id ? '0.5rem' : 0 }}
                onClick={() => setOpenListId((current) => (current === group.id ? '' : group.id))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    className="muted"
                    style={{
                      display: 'inline-block',
                      transition: 'transform 0.2s ease',
                      transform: openListId === group.id ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    ›
                  </span>
                  <h3>{group.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge">{pendingCount(group.items)} pending</span>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ padding: '0.2rem 0.5rem', borderRadius: '50%' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      addItemToGroup(group.id, 'New item')
                      if (openListId !== group.id) setOpenListId(group.id)
                    }}
                    aria-label="Quick add"
                  >
                    +
                  </button>
                </div>
              </div>

              {openListId === group.id && (
                <ul className="list-items" aria-label={`${group.name} items`}>
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="item-row"
                      draggable
                      onDragStart={() => setDraggingItemId(item.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => moveItem(group.id, item.id)}
                    >
                      <button
                        type="button"
                        className={item.done ? 'check done' : 'check'}
                        onClick={() => toggleItem(group.id, item.id)}
                        aria-label={item.done ? 'Mark item as not done' : 'Mark item as done'}
                      >
                        {item.done ? 'Done' : 'Todo'}
                      </button>
                      <p className={item.done ? 'item-text done' : 'item-text'}>{item.text}</p>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => deleteItem(group.id, item)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </Panel>
    </section>
  )
}
