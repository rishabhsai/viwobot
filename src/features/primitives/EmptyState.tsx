type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <p className="empty-title">{title}</p>
      <p className="empty-description">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn solid" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
